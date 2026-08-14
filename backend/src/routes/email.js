import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';
import { sendEmail } from '../lib/mailer.js';

const router = Router();

// POST /api/email/send { to, subject, body }
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { to, subject, body, html } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' });
    await sendEmail({ to, subject, body, html });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    // Email failures shouldn't 500 the whole request flow for the frontend —
    // still report it, but the frontend already treats email as best-effort.
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;
