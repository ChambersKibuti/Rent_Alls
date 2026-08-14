import { Router } from 'express';
import { getModel } from '../lib/entityModels.js';
import { getRules, checkExtraOwnership } from '../lib/entityRules.js';
import { attachUser, requireAuth } from '../lib/auth.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

const router = Router();
router.use(attachUser);

async function currentUser(req) {
  if (!req.userId) return null;
  return User.findById(req.userId).lean();
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

// A handful of entities (Product, Client, Payment, ...) store "seller_id"
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

    // Non-admins on non-public-read entities only see rows they own
    // (either directly, or via a Seller record they own).
    if (!rules.publicRead && user && user.role !== 'admin' && rules.ownerFields.length) {
      const identityIds = await getIdentityIds(user);
      const ownerClauses = rules.ownerFields.map((f) => ({ [f]: { $in: identityIds } }));
      filter = { $and: [filter, { $or: ownerClauses }] };
    }

    const sort = parseSort(req.query.sort);
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);

    const docs = await Model.find(filter).sort(sort).limit(limit).lean();
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
    const { rules, Model } = req;
    if (rules.adminOnly && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (rules.writeAdminOnly && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const doc = await Model.create({
      ...req.body,
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
