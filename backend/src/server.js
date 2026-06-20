// ============================================
// Velora Motors — Backend API
// ============================================
// Handles: inquiry form submissions, newsletter signups.
// Saves both to Supabase (Postgres) and emails a notification via Resend.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middleware ----
app.use(express.json());

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin }));

// Basic rate limiting so the public form endpoints can't be spammed/abused.
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                  // max 20 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' }
});

// ---- Supabase client ----
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---- Resend client ----
const resend = new Resend(process.env.RESEND_API_KEY);

// ---- Helpers ----
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return typeof phone === 'string' && /^[0-9+\-\s]{10,15}$/.test(phone);
}

async function sendNotificationEmail({ subject, html }) {
  // Email sending is best-effort: if it fails, we still keep the database
  // record and tell the caller sending the email failed, rather than losing
  // the submission entirely.
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.NOTIFY_EMAIL,
      subject,
      html
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] failed to send notification:', err.message);
    return { sent: false, error: err.message };
  }
}

// ---- Health check (useful for confirming the server is alive once deployed) ----
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'velora-motors-backend', status: 'running' });
});

// ---- POST /api/inquiry ----
// Body: { fullName, phone, carModel, partNeeded, items?: [{name, price}] }
app.post('/api/inquiry', formLimiter, async (req, res) => {
  const { fullName, phone, carModel, partNeeded, items } = req.body || {};

  // Server-side validation — never trust the client alone.
  const errors = {};
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.fullName = 'Please enter your name.';
  }
  if (!isValidPhone(phone)) {
    errors.phone = 'Enter a valid 10-15 digit phone number.';
  }
  if (!partNeeded || typeof partNeeded !== 'string' || partNeeded.trim().length < 3) {
    errors.partNeeded = 'Please describe the part you need.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    // 1. Save to database
    const { data: inquiry, error: dbError } = await supabase
      .from('inquiries')
      .insert({
        full_name: fullName.trim(),
        phone: phone.trim(),
        car_model: (carModel || '').trim() || null,
        part_needed: partNeeded.trim()
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. If cart items were attached, save those too (best-effort)
    if (Array.isArray(items) && items.length > 0) {
      const rows = items
        .filter(i => i && i.name)
        .map(i => ({ inquiry_id: inquiry.id, part_name: i.name, price: i.price || null }));
      if (rows.length > 0) {
        const { error: itemsError } = await supabase.from('inquiry_items').insert(rows);
        if (itemsError) console.error('[db] failed to save inquiry items:', itemsError.message);
      }
    }

    // 3. Email notification (best-effort, doesn't block the response)
    const itemsHtml = Array.isArray(items) && items.length > 0
      ? `<p><strong>Items of interest:</strong><br>${items.map(i => `${i.name} — ${i.price || 'N/A'}`).join('<br>')}</p>`
      : '';

    const emailResult = await sendNotificationEmail({
      subject: `New inquiry from ${fullName.trim()}`,
      html: `
        <h2>New inquiry — Velora Motors</h2>
        <p><strong>Name:</strong> ${fullName.trim()}</p>
        <p><strong>Phone:</strong> ${phone.trim()}</p>
        <p><strong>Car model:</strong> ${(carModel || 'Not specified').trim()}</p>
        <p><strong>Part needed:</strong> ${partNeeded.trim()}</p>
        ${itemsHtml}
        <p style="color:#888;font-size:12px;">Submitted at ${new Date().toLocaleString()}</p>
      `
    });

    return res.json({ ok: true, id: inquiry.id, emailSent: emailResult.sent });
  } catch (err) {
    console.error('[POST /api/inquiry] error:', err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong saving your inquiry. Please call us directly.' });
  }
});

// ---- POST /api/newsletter ----
// Body: { email }
app.post('/api/newsletter', formLimiter, async (req, res) => {
  const { email } = req.body || {};

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, errors: { email: 'Please enter a valid email address.' } });
  }

  try {
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.trim().toLowerCase() });

    // Postgres unique-constraint violation code is 23505 — treat "already subscribed" as a success, not an error.
    if (dbError && dbError.code !== '23505') throw dbError;

    const alreadySubscribed = dbError && dbError.code === '23505';

    if (!alreadySubscribed) {
      await sendNotificationEmail({
        subject: 'New newsletter subscriber',
        html: `<p><strong>${email.trim()}</strong> just subscribed to the Velora Motors newsletter.</p>`
      });
    }

    return res.json({ ok: true, alreadySubscribed: !!alreadySubscribed });
  } catch (err) {
    console.error('[POST /api/newsletter] error:', err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Velora Motors backend running on port ${PORT}`);
});
