# Velora Motors — Full Project

This folder contains the complete website: frontend (what visitors see) and
backend (where form submissions go). Open this whole folder in VS Code
(`File → Open Folder...`) to get both at once.

```
velora-project/
├── frontend/                 → the actual website
│   ├── index.html            → open this in a browser to view the site
│   └── assets/                → every image used on the site
│       ├── hero-car.png       → your uploaded car photo (hero + services background)
│       └── crop-*.jpg         → cropped details from that photo (catalog cards)
│
└── backend/                  → the server that powers the contact + newsletter forms
    ├── src/server.js          → the Express API
    ├── package.json
    ├── schema.sql             → run this once in Supabase to create your database tables
    ├── .env.example            → copy to .env and fill in your real keys
    └── README.md               → full step-by-step setup guide (Supabase, Resend, Render)
```

## Quick start

### View the website right now (no backend needed)
Just open `frontend/index.html` directly in your browser, or in VS Code install
the **"Live Server"** extension, right-click `index.html`, and choose
**"Open with Live Server"**. The site works fully — forms validate and show
success messages — even with no backend connected, since they fall back to
saving in the browser.

### Connect the real backend (database + email)
The backend is **not running anywhere yet** — it's code, waiting to be deployed.
Follow `backend/README.md` from top to bottom. In short:
1. Create a free Supabase account → run `schema.sql` there.
2. Create a free Resend account → get an API key for sending emails.
3. Fill in `backend/.env` with both sets of keys.
4. Deploy the `backend` folder to Render (free tier) → you'll get a live URL.
5. Paste that URL into `frontend/index.html` where it says `API_BASE_URL`
   (near the bottom, inside the `<script>` tag).

Once that's done, the inquiry form and newsletter form on the live site will
save to a real database and email you on every submission.

## About the images

Every image on this site is derived from the one car photo you uploaded —
either used directly (hero, services background) or cropped into close-up
details (wheel, brake, headlamp, splitter, etc.) for the catalog cards. If you
want different cars shown in different sections, add new photos into
`frontend/assets/` and update the matching `src="assets/..."` line in
`index.html`.

## Notes

- `frontend/index.html` is a single self-contained file (CSS and JS are inline)
  — only the images live separately in `assets/`. Keep `index.html` and the
  `assets` folder together; if you move one, move the other.
- `backend/.env` is intentionally **not** included — only `.env.example` is.
  You create your own `.env` with real secret keys, and it's excluded from git
  via `.gitignore` so you never accidentally publish your keys.
