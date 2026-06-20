# Velora Motors — Backend Setup Guide

This is the real backend for your website's forms. It does two things when someone
submits the Inquiry form or Newsletter form:
1. Saves the submission to a real database (Supabase).
2. Emails you a notification (Resend).

Everything below is **free** to start. Total setup time: ~20 minutes.

---

## Step 1 — Create your database (Supabase)

1. Go to **https://supabase.com** → Sign up (free) → "New Project".
2. Pick any name/password, choose the region closest to you, wait ~2 min for it to spin up.
3. Once it's ready, click **SQL Editor** in the left sidebar → **New query**.
4. Open the `schema.sql` file (included in this folder), copy all of it, paste it into the SQL editor, click **Run**.
   - This creates three tables: `inquiries`, `newsletter_subscribers`, `inquiry_items`.
5. Go to **Settings → API** (left sidebar). You'll need two values from this page:
   - **Project URL** → this is your `SUPABASE_URL`
   - **service_role key** (NOT the "anon" key — the service_role one, under "Project API keys") → this is your `SUPABASE_SERVICE_ROLE_KEY`
   - Keep the service_role key secret — it has full database access.

## Step 2 — Create your email sender (Resend)

1. Go to **https://resend.com** → Sign up (free, 100 emails/day, 3000/month).
2. Go to **API Keys** → **Create API Key** → copy it. This is your `RESEND_API_KEY`.
3. For `NOTIFY_EMAIL`, use whichever email address you want submissions sent to (e.g. your own Gmail).
4. For `FROM_EMAIL`, until you verify your own domain in Resend, you must use exactly:
   `onboarding@resend.dev`
   (Optional later: verify veloramotors.in under Resend → Domains, then switch `FROM_EMAIL` to something like `noreply@veloramotors.in`.)

## Step 3 — Fill in your environment variables

1. In this folder, copy `.env.example` to a new file named `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and paste in the real values from Steps 1 and 2.
3. Never share this `.env` file or commit it to a public GitHub repo — it contains secret keys.

## Step 4 — Run it locally to test (optional but recommended)

```bash
npm install
npm start
```

You should see: `Velora Motors backend running on port 3001`

Test it works by visiting `http://localhost:3001` in your browser — you should see a small JSON response confirming the server is running.

## Step 5 — Deploy for free (Render)

1. Push this `velora-backend` folder to a GitHub repository (create a free GitHub account if you don't have one).
2. Go to **https://render.com** → sign up free → **New +** → **Web Service**.
3. Connect your GitHub repo.
4. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
5. Under **Environment Variables** in Render, add every key from your `.env` file (same names, same values).
6. Click **Create Web Service**. Render will give you a live URL like:
   `https://velora-backend.onrender.com`

   That's your backend's real address.

⚠️ Free Render services "sleep" after 15 minutes of no traffic and take ~30-60 seconds to wake up on the next request. This is fine for a small business site — the first visitor after a quiet period just waits a bit longer.

## Step 6 — Connect your website to this backend

In your `index.html`, find these two lines near the top of the `<script>` section and update them to your real Render URL:

```js
const API_BASE_URL = 'https://velora-backend.onrender.com'; // <-- your Render URL goes here
```

Once that's set, the inquiry form and newsletter form will send real data to your real backend instead of just saving to the browser.

---

## Viewing your submissions

Go to your Supabase project → **Table Editor** (left sidebar) → click `inquiries` or `newsletter_subscribers` to see every submission in a spreadsheet-like view.

## Costs at this scale

- Supabase free tier: 500MB database, more than enough for years of form submissions.
- Resend free tier: 100 emails/day — plenty for a contact form.
- Render free tier: enough for a low-traffic business site. If traffic grows, Render's paid tier starts around $7/month for an always-on instance (no sleep delay).
