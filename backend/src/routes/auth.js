import { Router } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  generateOtp,
  requireAuth,
} from '../lib/auth.js';
import { sendEmail } from '../lib/mailer.js';

const router = Router();

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// POST /api/auth/register  { email, password }
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.is_verified) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await hashPassword(password);
    const otp_code = generateOtp();
    const otp_expires = new Date(Date.now() + OTP_TTL_MS);

    let user = existing;
    if (user) {
      Object.assign(user, { password_hash, otp_code, otp_expires });
    } else {
      user = new User({
        email: email.toLowerCase(),
        password_hash,
        otp_code,
        otp_expires,
        role: 'user',
      });
    }
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your verification code',
      body: `Your verification code is ${otp_code}. It expires in 15 minutes.`,
    });

    res.json({ message: 'Verification code sent', email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/resend-otp { email }
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found for that email' });

    user.otp_code = generateOtp();
    user.otp_expires = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your verification code',
      body: `Your verification code is ${user.otp_code}. It expires in 15 minutes.`,
    });

    res.json({ message: 'Verification code resent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// POST /api/auth/verify-otp { email, otpCode }
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !user.otp_code || user.otp_code !== otpCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    if (user.otp_expires && user.otp_expires < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    user.is_verified = true;
    user.otp_code = undefined;
    user.otp_expires = undefined;
    await user.save();

    const access_token = signToken(user);
    res.json({ access_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/login { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email first', needsVerification: true });
    }
    const access_token = signToken(user);
    res.json({ access_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/google { credential }
//
// `credential` is the ID token handed to the frontend by Google Identity
// Services after the user picks an account in the Google popup. We verify
// it server-side (never trust a token we haven't checked), then find or
// create a matching User. Google already verified the email, so accounts
// created this way are marked verified immediately -- no OTP step needed.
router.post('/google', async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(501).json({
        error: 'Google sign-in is not configured on this server. Set GOOGLE_CLIENT_ID in the backend environment.',
      });
    }
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential' });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    if (!payload?.email) {
      return res.status(400).json({ error: 'Google account has no verified email' });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        full_name: payload.name,
        is_verified: true,
        auth_provider: 'google',
        role: 'user',
      });
    } else if (!user.is_verified) {
      // A local-password signup existed but never finished OTP verification --
      // Google already proved the email is real, so unblock the account.
      user.is_verified = true;
      await user.save();
    }

    const access_token = signToken(user);
    res.json({ access_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { _id, password_hash, otp_code, reset_token, __v, ...rest } = user;
  res.json({ id: String(_id), ...rest });
});

// PUT /api/auth/me
router.put('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const disallowed = ['password_hash', 'email', 'role', '_id', 'id'];
  for (const [key, value] of Object.entries(req.body || {})) {
    if (!disallowed.includes(key)) user[key] = value;
  }
  await user.save();
  const { password_hash, otp_code, reset_token, __v, _id, ...rest } = user.toObject();
  res.json({ id: String(_id), ...rest });
});

// POST /api/auth/reset-password-request { email }
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    // Always respond success (don't leak which emails exist)
    if (user) {
      const reset_token = crypto.randomBytes(24).toString('hex');
      user.reset_token = reset_token;
      user.reset_token_expires = new Date(Date.now() + RESET_TTL_MS);
      await user.save();
      const resetUrl = `${process.env.APP_URL || ''}/reset-password?token=${reset_token}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        body: `Reset your password here: ${resetUrl} (valid for 1 hour)`,
      });
    }
    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password { token, password }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ reset_token: token });
    if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }
    user.password_hash = await hashPassword(password);
    user.reset_token = undefined;
    user.reset_token_expires = undefined;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/logout — stateless (JWT); client just discards the token
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

export default router;
