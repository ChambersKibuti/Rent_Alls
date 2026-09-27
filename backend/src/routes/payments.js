import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';
import Payment from '../models/Payment.js';
import PlatformConfig from '../models/PlatformConfig.js';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import User from '../models/User.js';
import Client from '../models/Client.js';

const router = Router();
const PLAN_FEES = { '2_months': 499, '6_months': 1299, '1_year': 2399 };
const PLAN_MONTHS = { '2_months': 2, '6_months': 6, '1_year': 12 };
const PAYMENT_METHODS = ['Bank Transfer', 'Mobile Money', 'Card', 'USSD'];

async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.adminUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function getConfig() {
  return PlatformConfig.findOne().sort({ created_date: -1 }).lean();
}

router.get('/policy', async (_req, res) => {
  const config = await getConfig();
  res.json({
    seller_subscription_required: config?.seller_subscription_required !== false,
    commission_rate: config?.commission_rate ?? 0.2,
    commission_payment_method: config?.commission_payment_method || 'Bank Transfer',
    commission_account_name: config?.commission_account_name || '',
    commission_account_number: config?.commission_account_number || '',
    commission_bank_name: config?.commission_bank_name || '',
  });
});

router.get('/product-access/:productId', requireAuth, async (req, res) => {
  const [user, product] = await Promise.all([
    User.findById(req.userId).lean(),
    Product.findById(req.params.productId).lean(),
  ]);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const seller = product.seller_id ? await Seller.findById(product.seller_id).select('created_by_id').lean() : null;
  const isOwner = String(product.created_by_id || '') === String(req.userId) ||
    String(seller?.created_by_id || '') === String(req.userId);
  const hasAccess = user?.role === 'admin' || user?.free_product_access || isOwner ||
    !!(await Payment.exists({
      payment_purpose: 'product_access',
      product_id: String(product._id),
      payer_id: String(req.userId),
      status: 'Completed',
    }));
  const pending = await Payment.findOne({
    payment_purpose: 'product_access',
    product_id: String(product._id),
    payer_id: String(req.userId),
    status: 'Pending',
  }).sort({ created_date: -1 }).select('_id status amount reference_number created_date').lean();

  res.json({ has_access: Boolean(hasAccess), pending_payment: pending || null });
});

router.post('/submit', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'User account not found' });

  const { purpose, payment_method: paymentMethod, proof_message: proofMessage } = req.body || {};
  const proof = typeof proofMessage === 'string' ? proofMessage.trim() : '';
  if (!['seller_subscription', 'product_access'].includes(purpose)) {
    return res.status(400).json({ error: 'Invalid payment purpose' });
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Select a valid payment method' });
  }
  if (proof.length < 5 || proof.length > 3000) {
    return res.status(400).json({ error: 'Paste a payment confirmation message (5 to 3000 characters)' });
  }

  let sellerId = '';
  let productId = '';
  let productTitle = '';
  let planId = '';
  let amount = 0;
  let seller = null;

  if (purpose === 'seller_subscription') {
    const config = await getConfig();
    if (config?.seller_subscription_required === false) {
      return res.status(409).json({ error: 'Seller subscription payments are disabled' });
    }
    planId = req.body.plan_id;
    amount = PLAN_FEES[planId];
    if (!amount) return res.status(400).json({ error: 'Select a valid subscription plan' });
    seller = await Seller.findOne({ _id: req.body.seller_id, created_by_id: String(user._id) });
    if (!seller) return res.status(403).json({ error: 'Seller account not found' });
    if (seller.fee_waiver) return res.status(409).json({ error: 'This seller account already has a free subscription' });
    sellerId = String(seller._id);
  } else {
    const product = await Product.findById(req.body.product_id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (user.free_product_access) return res.status(409).json({ error: 'Your account already has free product access' });
    if (String(product.created_by_id || '') === String(user._id)) {
      return res.status(409).json({ error: 'You already own this product listing' });
    }
    const alreadyPaid = await Payment.exists({
      payment_purpose: purpose,
      product_id: String(product._id),
      payer_id: String(user._id),
      status: 'Completed',
    });
    if (alreadyPaid) return res.status(409).json({ error: 'Product access is already approved' });
    const config = await getConfig();
    amount = product.price_per_day * (config?.commission_rate ?? 0.2);
    productId = String(product._id);
    productTitle = product.title;
    sellerId = product.seller_id || '';
  }

  const lookup = {
    payment_purpose: purpose,
    payer_id: String(user._id),
    status: 'Pending',
    ...(purpose === 'seller_subscription' ? { seller_id: sellerId } : { product_id: productId }),
  };
  let payment = await Payment.findOne(lookup);
  if (payment) {
    Object.assign(payment, { amount, payment_method: paymentMethod, proof_message: proof, plan_id: planId || undefined });
  } else {
    payment = new Payment({
      product_id: productId || sellerId,
      product_title: productTitle || seller?.business_name || 'Seller subscription',
      amount,
      payment_type: purpose === 'seller_subscription' ? 'Subscription' : 'Product Access',
      payment_purpose: purpose,
      payment_method: paymentMethod,
      proof_message: proof,
      reference_number: proof.slice(0, 200),
      plan_id: planId || undefined,
      seller_id: sellerId,
      client_id: String(user._id),
      payer_id: String(user._id),
      payer_email: user.email,
      status: 'Pending',
      created_by_id: String(user._id),
      created_by_email: user.email,
    });
  }
  await payment.save();
  res.status(201).json({ id: String(payment._id), status: payment.status, amount: payment.amount });
});

router.post('/:paymentId/approve', requireAuth, requireAdmin, async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'Pending' || !payment.payment_purpose) {
    return res.status(409).json({ error: 'Payment is not awaiting review' });
  }

  if (payment.payment_purpose === 'seller_subscription') {
    const seller = await Seller.findOne({ _id: payment.seller_id, created_by_id: payment.payer_id });
    const months = PLAN_MONTHS[payment.plan_id];
    if (!seller || !months) return res.status(409).json({ error: 'Subscription payment details are incomplete' });
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    seller.subscription_plan = payment.plan_id;
    seller.subscription_fee = payment.amount;
    seller.subscription_start = start.toISOString().slice(0, 10);
    seller.subscription_end = end.toISOString().slice(0, 10);
    seller.status = 'Active';
    seller.fee_waiver = false;
    await seller.save();
  } else if (payment.payment_purpose === 'product_access') {
    const user = await User.findById(payment.payer_id).select('email full_name phone').lean();
    if (!user) return res.status(409).json({ error: 'Buyer account no longer exists' });
    const existingClient = await Client.findOne({ product_id: payment.product_id, client_email: user.email, status: 'Active' });
    if (!existingClient) {
      await Client.create({
        product_id: payment.product_id,
        product_title: payment.product_title,
        seller_id: payment.seller_id,
        client_name: user.full_name || user.email,
        client_phone: user.phone || '',
        client_email: user.email,
        status: 'Active',
        created_by_id: payment.payer_id,
        created_by_email: user.email,
      });
    }
  }

  payment.status = 'Completed';
  payment.commission_paid = payment.payment_purpose === 'product_access';
  payment.seller_revealed = payment.payment_purpose === 'product_access';
  payment.reviewed_by_id = String(req.adminUser._id);
  payment.reviewed_at = new Date();
  await payment.save();
  res.json({ id: String(payment._id), status: payment.status });
});

router.post('/:paymentId/reject', requireAuth, requireAdmin, async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'Pending' || !payment.payment_purpose) {
    return res.status(409).json({ error: 'Payment is not awaiting review' });
  }
  payment.status = 'Failed';
  payment.review_note = typeof req.body?.review_note === 'string' ? req.body.review_note.slice(0, 500) : '';
  payment.reviewed_by_id = String(req.adminUser._id);
  payment.reviewed_at = new Date();
  await payment.save();
  res.json({ id: String(payment._id), status: payment.status });
});

export default router;