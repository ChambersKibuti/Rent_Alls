import express from 'express';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.js';
import entityRoutes from './routes/entities.js';
import uploadRoutes from './routes/upload.js';
import emailRoutes from './routes/email.js';

const app = express();

// In the split-repo setup the frontend and backend are usually on
// different domains, so CORS needs to be explicit. Set CORS_ORIGIN to a
// comma-separated allowlist in production; leave it unset locally to
// allow any origin (simplest for local dev with the Vite proxy).
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json({ limit: '2mb' }));

// Health check runs before the DB middleware on purpose: it lets you
// confirm the deployment itself is alive even if MONGODB_URI is missing
// or wrong -- the single most useful signal when a deploy "works" but
// every other route 500s.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Ensure a DB connection exists before handling any other /api request.
// mongoose caches the connection (see lib/db.js), so this is cheap
// on warm serverless invocations.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ error: 'Database connection failed. Check MONGODB_URI.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/email', emailRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

export default app;
