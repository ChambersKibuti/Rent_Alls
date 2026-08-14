import 'dotenv/config';
import app from '../src/app.js';

// Vercel's Node.js runtime accepts a plain (req, res) handler -- an Express
// app already matches that signature, so we can export it directly.
export default app;
