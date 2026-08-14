import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromReq(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Express-style middleware: attaches req.userId if a valid token is present.
 * Does NOT reject the request by itself — use requireAuth for that.
 */
export function attachUser(req, _res, next) {
  const token = getTokenFromReq(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.userId = payload.sub;
  }
  next();
}

export function requireAuth(req, res, next) {
  const token = getTokenFromReq(req);
  const payload = token && verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = payload.sub;
  next();
}
