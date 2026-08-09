# UserForge

A React user-management app: create/edit/delete users, search & filter, bulk
CSV/Excel import with per-row validation, CSV/Excel export, and automatic
"welcome" email notifications (via Gmail) whenever a user is added.

Runs entirely on free tiers with **no server for you to manage**:

- **Frontend**: React + Vite, hosted on [Vercel](https://vercel.com) (free)
- **Database**: [Supabase](https://supabase.com) Postgres (free) — the React app talks
  to it directly using the Supabase client SDK, no custom CRUD backend needed
- **Email**: one small Vercel serverless function (`/api/send-welcome-email`)
  using [Nodemailer](https://nodemailer.com) over Gmail SMTP — this is the only
  part that truly needs server-side code, since browsers can't open raw SMTP
  connections

```
Browser (React) ──CRUD──▶ Supabase Postgres
        │
        └──POST /api/send-welcome-email──▶ Vercel serverless function ──▶ Gmail SMTP
```

> **I could not run `npm install` / `npm run dev` in the environment that generated
> this code** — Node.js isn't installed there. Everything below was written and
> reviewed carefully, but you're the first to actually run it. If something doesn't
> compile, paste the error and it can be fixed quickly.

## 1. Prerequisites (all free)

- [Node.js 18+](https://nodejs.org)
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account
- A Gmail account with **2-Step Verification enabled**, so you can generate an
  **App Password** (regular Gmail passwords don't work for SMTP)

## 2. Set up Supabase (the database)

1. Create a new project at [supabase.com](https://supabase.com) (free tier).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
   `users` table and a permissive row-level-security policy for the anon key
   (see the security note in that file).
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ full database access,
     bypasses RLS — never expose this to the browser, only `/api` routes use it)

## 3. Set up Gmail App Password (for welcome emails)

1. Turn on 2-Step Verification: <https://myaccount.google.com/signinoptions/two-step-verification>
2. Generate an App Password: <https://myaccount.google.com/apppasswords>
   (choose "Mail" as the app). Copy the 16-character password.
3. You'll use your Gmail address as `GMAIL_USER` and this app password as
   `GMAIL_APP_PASSWORD`.

## 4. Local development

```bash
npm install
cp .env.example .env    # fill in the values from steps 2 and 3 (skip INTERNAL_API_SECRET for now — step 6)
npm install -g vercel   # one-time, free CLI — needed to run the /api function locally
vercel dev               # serves the React app AND /api/* together
```

`vercel dev` will ask you to log in / link a project the first time (free,
just needs a Vercel account) — after that it reads `.env` automatically and
serves everything at **http://localhost:3000**.

If you only want the frontend (no email testing), `npm run dev` alone works
too (Vite on port 5173), but calls to `/api/send-welcome-email` will 404.

## 5. Deploy (free, no server to manage)

1. Push this repo to GitHub.
2. In the Vercel dashboard: **Add New → Project → Import** your GitHub repo.
   Vercel auto-detects Vite + the `/api` folder — no config needed.
3. Before the first deploy, add the environment variables from your `.env`
   file under **Project Settings → Environment Variables** (`INTERNAL_API_SECRET`
   included — set in step 6 below, but fine to add here too).
4. Deploy. You'll get a public `https://userforge-xxxx.vercel.app` URL.
5. Every future `git push` to your default branch auto-redeploys.

## 6. Set up "create/delete user via GitHub issue"

Opening a **"👤 New User Request"** or **"🗑️ Delete User Request"** issue (from
the *Issues → New issue* picker) creates/deletes a real user and — for
creation — sends them the welcome email, automatically. **Only issues opened
by a repo owner or collaborator are processed** — anyone else's request gets
closed with an "unauthorized" comment and nothing happens.

Setup (one-time):

1. Generate a random secret, e.g. `openssl rand -hex 32` (or any password
   generator — it just needs to be long and random).
2. Add it in **two places** with the exact same value:
   - Vercel: **Project Settings → Environment Variables** → `INTERNAL_API_SECRET`
   - GitHub: **repo Settings → Secrets and variables → Actions → Secrets tab**
     → **New repository secret** → name `INTERNAL_API_SECRET`
3. Also add a GitHub repo **variable** (not secret — it's not sensitive):
   **Settings → Secrets and variables → Actions → Variables tab** → **New
   repository variable** → name `VERCEL_APP_URL`, value your production URL
   (e.g. `https://userforge-7vx1.vercel.app`, no trailing slash).
4. Redeploy on Vercel so it picks up `INTERNAL_API_SECRET`.

Now try it: **Issues → New issue → "👤 New User Request"**, fill in the form,
submit. Within a few seconds the Action comments on the issue with the
result and closes it.

## Project structure

```
userforge/
├── src/
│   ├── App.jsx                 # page routing + data loading
│   ├── components/              # UserList, AddUser, BulkUpload, EditDeleteUser, ExportData, Sidebar
│   ├── lib/
│   │   ├── supabaseClient.js    # Supabase client init
│   │   ├── api.js               # CRUD calls against the `users` table
│   │   ├── validation.js        # email/phone/required-field validation
│   │   ├── csvExcel.js          # CSV/Excel parsing, validation, export, template
│   │   └── emailClient.js       # calls /api/send-welcome-email
│   └── assets/                  # logo.svg, empty-state.svg
├── api/
│   ├── _supabaseAdmin.js        # server-side Supabase client (service_role key, bypasses RLS)
│   ├── _mailer.js                # shared Nodemailer/Gmail email builder+sender
│   ├── send-welcome-email.js    # called by the browser after a create/import
│   ├── github-user-request.js   # called only by the GitHub Action below (secret-authenticated)
│   └── health.js                # reports whether email is configured (used by the sidebar)
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── new-user-request.yml
│   │   └── delete-user-request.yml
│   └── workflows/
│       └── user-request-sync.yml  # authorizes + processes the above issue forms
├── supabase/
│   └── schema.sql               # users table + RLS policy
└── .env.example
```

## Features

- **Create / Read / Update / Delete** users (full name, email, phone, age,
  department, role, status)
- **Search & filter** the user list by name/email, department, status
- **Bulk upload** via CSV or Excel — per-row validation preview (missing
  fields, bad email/phone format, in-file and DB duplicate emails) before
  import; downloadable template
- **Export** the full list as CSV or Excel
- **Welcome emails** — sent automatically (single add, bulk import, *and*
  GitHub-issue requests) with the user's department and role in the email body
- **Create/delete via GitHub issue** — repo owners/collaborators can open a
  "New User Request" or "Delete User Request" issue to trigger the same
  create-or-delete-plus-email flow, without opening the app (see setup step 6)

## Security notes

- The Supabase **anon key** is public by design (it ships in the browser
  bundle) and the RLS policy in `schema.sql` grants it full read/write access
  to the `users` table. That's fine for a personal/internal tool you don't
  share widely. If you plan to expose this app's URL to people you don't
  trust, add [Supabase Auth](https://supabase.com/docs/guides/auth) and scope
  the RLS policy to authenticated users instead.
- The Gmail credentials (`GMAIL_USER` / `GMAIL_APP_PASSWORD`) and the Supabase
  **service_role key** are **server-side only** — never sent to the browser,
  only used inside `/api` serverless functions.
- `/api/send-welcome-email` only sends if a matching row already exists in
  the `users` table, so it can't be used as a blind relay to email arbitrary
  addresses.
- `/api/github-user-request` requires a shared secret header
  (`INTERNAL_API_SECRET`) that only the GitHub Action knows, and the Action
  itself refuses to act on issues from anyone who isn't a repo owner/member/
  collaborator (`author_association` check) — so opening a request issue as
  a random public visitor does nothing but get the issue closed.
