import { Router } from 'express';
import { getModel } from '../lib/entityModels.js';
import { getRules, checkExtraOwnership } from '../lib/entityRules.js';
import { attachUser, requireAuth } from '../lib/auth.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Payment from '../models/Payment.js';
import PlatformConfig from '../models/PlatformConfig.js';

const router = Router();
router.use(attachUser);

async function currentUser(req) {
  if (!req.userId) return null;
  return User.findById(req.userId).lean();
}

async function sellerCanManageProducts(user, res) {
  if (user?.role === 'admin') return null;
  const seller = await Seller.findOne({ created_by_id: String(user?._id) });
  if (!seller) {
    res.status(403).json({ error: 'Create a seller account before listing products' });
    return null;
  }
  const config = await PlatformConfig.findOne().sort({ created_date: -1 }).lean();
  const subscriptionRequired = config?.seller_subscription_required !== false;
  const expired = seller.subscription_end && new Date(seller.subscription_end) < new Date();
  if (subscriptionRequired && !seller.fee_waiver && (seller.status !== 'Active' || expired)) {
    res.status(403).json({ error: 'An approved seller subscription is required to manage listings' });
    return null;
  }
  return seller;
}

function parseSort(sortParam) {
  if (!sortParam) return { created_date: -1 };
  const desc = sortParam.startsWith('-');
  const field = desc ? sortParam.slice(1) : sortParam;
  return { [field]: desc ? -1 : 1 };
}

// The frontend (unchanged from the base44 days) sometimes filters by the
// public "id" field, e.g. { id: seller.id }. Our documents only carry
// Mongo's "_id" -- translate transparently so those queries keep working.
function normalizeFilter(filter) {
  if (!filter || typeof filter !== 'object') return filter;
  const { id, ...rest } = filter;
  if (id !== undefined) rest._id = id;
  return rest;
}

// A handful of modules (Product, Client, Payment, ...) store "seller_id"
// pointing at the *Seller document's* id, not the auth user's id directly
// (matching how the original app writes/reads these fields). To evaluate
// ownership correctly we need the current user's own identity id *and* the
// id(s) of any Seller record(s) they own.
async function getIdentityIds(user) {
  if (!user) return [];
  const ids = [String(user._id)];
  const ownedSellers = await Seller.find({ created_by_id: String(user._id) }).select('_id').lean();
  ownedSellers.forEach((s) => ids.push(String(s._id)));
  return ids;
}

function isOwner(doc, rules, identityIds) {
  if (!identityIds.length) return false;
  return rules.ownerFields.some((f) => identityIds.includes(String(doc[f])));
}

router.param('entity', (req, res, next, entity) => {
  const Model = getModel(entity);
  if (!Model) return res.status(404).json({ error: `Unknown entity "${entity}"` });
  req.Model = Model;
  req.entityName = entity;
  req.rules = getRules(entity);
  next();
});

// LIST / FILTER
router.get('/:entity', async (req, res) => {
  try {
    const user = await currentUser(req);
    const { rules, Model } = req;

    if (rules.adminOnly && (!user || user.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!rules.publicRead && !user) {
      return res.status(401).json({ error: 'Sign in required' });
    }

    let filter = {};
    if (req.query.filter) {
      try {
        filter = JSON.parse(req.query.filter);
      } catch {
        return res.status(400).json({ error: 'Invalid filter JSON' });
      }
    }
    filter = normalizeFilter(filter);

    // Non-admins on non-public-read modules only see rows they own
    // (either directly, or via a Seller record they own).
    if (!rules.publicRead && user && user.role !== 'admin' && rules.ownerFields.length) {
      const identityIds = await getIdentityIds(user);
      const ownerClauses = rules.ownerFields.map((f) => ({ [f]: { $in: identityIds } }));
      filter = { $and: [filter, { $or: ownerClauses }] };
    }

    const sort = parseSort(req.query.sort);
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);

    const docs = await Model.find(filter).sort(sort).limit(limit).lean();
    const isSingleProduct = req.entityName === 'Product' && filter._id && Object.keys(filter).length === 1;
    if (req.entityName === 'Product' && docs.length) {
      const userHasGlobalAccess = user && (user.role === 'admin' || user.free_product_access);
      const ownedSeller = user && await Seller.findOne({ created_by_id: String(user._id) }).select('_id').lean();
      const ownedSellerId = ownedSeller ? String(ownedSeller._id) : '';
      const paidProductIds = user && !userHasGlobalAccess
        ? new Set((await Payment.find({ payer_id: String(user._id), payment_purpose: 'product_access', status: 'Completed' }).distinct('product_id')).map(String))
        : new Set();
      const result = docs.map((product) => {
        const isOwner = user && (
          String(product.created_by_id || '') === String(user._id) ||
          (ownedSellerId && String(product.seller_id || '') === ownedSellerId)
        );
        if (!userHasGlobalAccess && !isOwner && !paidProductIds.has(String(product._id))) {
          const preview = serialize(product);
          return {
            id: preview.id,
            title: preview.title,
            category: preview.category,
            status: preview.status,
            price_per_day: preview.price_per_day,
            quantity_available: preview.quantity_available,
            image_url: preview.image_url || preview.images?.[0] || '',
            locked: true,
          };
        }
        return serialize(product);
      });
      if (!isSingleProduct) return res.json(result);
    }
    if (isSingleProduct && docs.length) {
      const product = docs[0];
      const seller = product.seller_id ? await Seller.findById(product.seller_id).select('created_by_id').lean() : null;
      const isOwner = user && (
        String(product.created_by_id || '') === String(user._id) ||
        String(seller?.created_by_id || '') === String(user._id)
      );
      const hasAccess = user && (
        user.role === 'admin' || user.free_product_access || isOwner ||
        await Payment.exists({
          payment_purpose: 'product_access',
          product_id: String(product._id),
          payer_id: String(user._id),
          status: 'Completed',
        })
      );
      if (!hasAccess) {
        const preview = serialize(product);
        return res.json([{
          id: preview.id,
          title: preview.title,
          category: preview.category,
          status: preview.status,
          price_per_day: preview.price_per_day,
          quantity_available: preview.quantity_available,
          image_url: preview.image_url || preview.images?.[0] || '',
          locked: true,
        }]);
      }
    }
    res.json(docs.map(serialize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list records' });
  }
});

// CREATE
router.post('/:entity', requireAuth, async (req, res) => {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: 'User account not found' });
    const { rules, Model } = req;
    const body = { ...req.body };
    if (req.entityName === 'Payment' && user.role !== 'admin' && (
      body.payment_purpose || body.proof_message || body.payer_id || body.reviewed_by_id || body.reviewed_at
    )) {
      return res.status(403).json({ error: 'Submit payment proof through the payment review flow' });
    }
    if (req.entityName === 'Seller' && user.role !== 'admin') {
      const config = await PlatformConfig.findOne().sort({ created_date: -1 }).lean();
      body.status = config?.seller_subscription_required === false ? 'Active' : 'Pending';
      body.fee_waiver = config?.seller_subscription_required === false;
    }
    if (req.entityName === 'Product') {
      const seller = await sellerCanManageProducts(user, res);
      if (!seller && user.role !== 'admin') return;
      if (seller) body.seller_id = String(seller._id);
    }
    if (req.entityName === 'Showroom') body.host_id = String(user._id);
    if (rules.adminOnly && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (rules.writeAdminOnly && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const doc = await Model.create({
      ...body,
      created_by_id: String(user._id),
      created_by_email: user.email,
    });
    res.status(201).json(serialize(doc.toObject()));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to create record' });
  }
});

// UPDATE
router.put('/:entity/:id', requireAuth, async (req, res) => {
  try {
    const user = await currentUser(req);
    const { rules, Model } = req;
    const existing = await Model.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    if (req.entityName === 'Payment' && user?.role !== 'admin') {
      const protectedFields = ['payment_purpose', 'proof_message', 'payer_id', 'status', 'reviewed_by_id', 'reviewed_at'];
      if (protectedFields.some((field) => Object.hasOwn(req.body || {}, field))) {
        return res.status(403).json({ error: 'Payment review fields can only be changed through the payment review flow' });
      }
    }
    if (req.entityName === 'Seller' && user?.role !== 'admin') {
      for (const field of ['fee_waiver', 'rebate_status', 'rebate_amount', 'subscription_plan', 'subscription_fee', 'subscription_start', 'subscription_end']) {
        delete req.body[field];
      }
      if (req.body.status !== 'Expired') delete req.body.status;
    }
    if (req.entityName === 'Product') {
      const seller = await sellerCanManageProducts(user, res);
      if (!seller && user?.role !== 'admin') return;
      if (seller) req.body.seller_id = String(seller._id);
    }

    if (rules.adminOnly && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (rules.writeAdminOnly && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!rules.adminOnly && !rules.writeAdminOnly) {
      // Note: publicRead only affects GET/list -- writes always require
      // ownership (or admin), regardless of whether the entity is publicly
      // readable.
      const identityIds = await getIdentityIds(user);
      const allowed =
        user?.role === 'admin' ||
        isOwner(existing, rules, identityIds) ||
        (await checkExtraOwnership(req.entityName, existing, user));
      if (!allowed) {
        return res.status(403).json({ error: 'Not allowed to update this record' });
      }
    }

    Object.assign(existing, req.body);
    await existing.save();
    res.json(serialize(existing.toObject()));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to update record' });
  }
});

// DELETE
router.delete('/:entity/:id', requireAuth, async (req, res) => {
  try {
    const user = await currentUser(req);
    const { rules, Model } = req;
    const existing = await Model.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    if (rules.adminOnly && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const identityIds = await getIdentityIds(user);
    const allowed = user?.role === 'admin' || isOwner(existing, rules, identityIds);
    if (!allowed) {
      return res.status(403).json({ error: 'Not allowed to delete this record' });
    }

    await existing.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to delete record' });
  }
});

function serialize(doc) {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export default router;
