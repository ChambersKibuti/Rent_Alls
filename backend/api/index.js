import 'dotenv/config';
import app from '../src/app.js';

// Keep the Vercel boundary explicit so the runtime does not need to infer an
// Express app from the module's default export.
export default function handler(req, res) {
	return app(req, res);
}
