import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import User from '../models/User.js';

const router = Router();
const PLAN_MONTHS = { '2_months': 2, '6_months': 6, '1_year': 12 };

router.use(requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.adminUser = user;
    next();
  } catch (err) {
    next(err);
  }
});

router.get('/portfolio', async (_req, res) => {
  const [users, sellers, products, payments] = await Promise.all([
    User.find({ role: { $ne: 'admin' } }).select('email full_name user_type free_product_access rebate_amount rebate_status created_date updated_date').sort({ created_date: -1 }).limit(1000).lean(),
    Seller.find().sort({ created_date: -1 }).limit(1000).lean(),
    Product.find().select('seller_id created_by_id').lean(),
    Payment.find().select('payer_id payer_email client_id seller_id payment_purpose payment_type status amount created_date').lean(),
  ]);

  const sellerByOwner = new Map(sellers.map((seller) => [String(seller.created_by_id), seller]));
  const activity = users.map((user) => {
    const id = String(user._id);
    const seller = sellerByOwner.get(id) || null;
    const userPayments = payments.filter((payment) =>
      String(payment.payer_id || payment.client_id || '') === id ||
      (seller && String(payment.seller_id || '') === String(seller._id))
    );
    return {
      id,
      email: user.email,
      full_name: user.full_name || '',
      user_type: user.user_type || 'buyer',
      free_product_access: Boolean(user.free_product_access),
      rebate_amount: user.rebate_amount || 0,
      rebate_status: user.rebate_status || 'None',
      created_date: user.created_date,
      last_activity: user.updated_date,
      seller: seller ? {
        id: String(seller._id),
        business_name: seller.business_name,
        status: seller.status,
        subscription_plan: seller.subscription_plan,
        subscription_end: seller.subscription_end,
        fee_waiver: Boolean(seller.fee_waiver),
        rebate_status: seller.rebate_status,
        rebate_amount: seller.rebate_amount || 0,
        product_count: products.filter((product) => String(product.seller_id || '') === String(seller._id)).length,
      } : null,
      activity: {
        total_payments: userPayments.length,
        pending_payments: userPayments.filter((payment) => payment.status === 'Pending').length,
        completed_payments: userPayments.filter((payment) => payment.status === 'Completed').length,
        product_accesses: userPayments.filter((payment) => payment.payment_purpose === 'product_access' && payment.status === 'Completed').length,
        rentals: userPayments.filter((payment) => payment.payment_type === 'Rent' && payment.status === 'Completed').length,
      },
    };
  });

  res.json(activity);
});

router.patch('/users/:userId/benefits', async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (typeof req.body?.free_product_access === 'boolean') {
    user.free_product_access = req.body.free_product_access;
  }
  if (req.body?.rebate_amount !== undefined) {
    const amount = Number(req.body.rebate_amount);
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: 'Rebate amount must be zero or more' });
    user.rebate_amount = amount;
    user.rebate_status = amount > 0 ? 'Eligible' : 'None';
  }
  if (req.body?.mark_rebate_paid === true) user.rebate_status = 'Paid';
  await user.save();
  res.json({
    id: String(user._id),
    free_product_access: user.free_product_access,
    rebate_amount: user.rebate_amount,
    rebate_status: user.rebate_status,
  });
});

router.patch('/sellers/:sellerId/benefits', async (req, res) => {
  const seller = await Seller.findById(req.params.sellerId);
  if (!seller) return res.status(404).json({ error: 'Seller not found' });
  const { free_subscription: freeSubscription, rebate_amount: rebateAmount, mark_rebate_paid: markRebatePaid } = req.body || {};

  if (typeof freeSubscription === 'boolean') {
    seller.fee_waiver = freeSubscription;
    if (freeSubscription) {
      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + (PLAN_MONTHS[seller.subscription_plan] || 2));
      seller.subscription_start = start.toISOString().slice(0, 10);
      seller.subscription_end = end.toISOString().slice(0, 10);
      seller.status = 'Active';
    } else if (seller.status === 'Active' && seller.subscription_end && new Date(seller.subscription_end) < new Date()) {
      seller.status = 'Expired';
    }
  }
  if (rebateAmount !== undefined) {
    const amount = Number(rebateAmount);
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: 'Rebate amount must be zero or more' });
    seller.rebate_amount = amount;
    seller.rebate_status = amount > 0 ? 'Eligible' : 'None';
  }
  if (markRebatePaid === true) seller.rebate_status = 'Paid';
  await seller.save();
  res.json({
    id: String(seller._id),
    fee_waiver: seller.fee_waiver,
    status: seller.status,
    rebate_status: seller.rebate_status,
    rebate_amount: seller.rebate_amount,
    subscription_end: seller.subscription_end,
  });
});

export default router;