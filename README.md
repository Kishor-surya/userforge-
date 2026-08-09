# UserForge

A React user-management app with real authentication: admins manage the
full roster (create/edit/delete, bulk CSV/Excel import, export), while
regular users sign in and see only their own department. New users get an
activation email with a randomly-generated temporary password and a
one-time link to sign in and immediately set their own.

Runs entirely on free tiers with **no server for you to manage**:

- **Frontend**: React + Vite, hosted on [Vercel](https://vercel.com) (free)
- **Database + Auth**: [Supabase](https://supabase.com) Postgres (free) — Supabase Auth
  handles real user accounts; Postgres Row Level Security restricts each
  signed-in user to their own department
- **Email**: Vercel serverless functions using [Nodemailer](https://nodemailer.com)
  over Gmail SMTP — the only part that truly needs server-side code, since
  browsers can't open raw SMTP connections (or call Supabase's admin API,
  which also has to happen server-side)

```
Admin browser ──X-Admin-Token──▶ /api/{create,update,delete}-user, /api/admin-users ──▶ Supabase (service_role, bypasses RLS)
                                          │
                                          └──▶ create Auth user w/ temp password + recovery link ──▶ Gmail SMTP (activation email)

Regular user browser ──Supabase session──▶ Supabase Postgres directly (RLS: own department only)

GitHub issue (owner/collaborator only) ──Action──▶ /api/github-user-request (shared secret) ──▶ same creation path
```

> **I could not run `npm install` / `npm run dev` in the environment that generated
> this code** — Node.js isn't installed there. Everything below was written
> carefully and follows Supabase's documented patterns, but the auth/activation-link
> flow in particular (`src/lib/auth.js`, `SetPassword.jsx`, the `type=recovery` URL
> handling in `App.jsx`) is the piece most in need of hands-on testing, since I
> can't exercise a real browser redirect here. Test that flow first.

## 1. Prerequisites (all free)

- [Node.js 18+](https://nodejs.org)
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account
- A Gmail account with **2-Step Verification enabled**, so you can generate an
  **App Password** (regular Gmail passwords don't work for SMTP)

## 2. Set up Supabase (database + auth)

1. Create a new project at [supabase.com](https://supabase.com) (free tier).
2. Open **SQL Editor → New query**:
   - **Brand new project**: paste and run [`supabase/schema.sql`](supabase/schema.sql) (the full current state).
   - **Existing project**: run the numbered migration files in order —
     [`migration_002_auth_and_audit.sql`](supabase/migration_002_auth_and_audit.sql),
     then [`migration_003_leave_and_provisioning.sql`](supabase/migration_003_leave_and_provisioning.sql).
     Both are safe to re-run.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ full database access,
     bypasses RLS — never expose this to the browser, only `/api` routes use it)
4. Go to **Authentication → URL Configuration** and set **Site URL** to your
   deployed app's URL (same value you'll use for `APP_URL` below). This is
   where invite links redirect people after they click them.

## 3. Set up Gmail App Password (for invite/welcome emails)

1. Turn on 2-Step Verification: <https://myaccount.google.com/signinoptions/two-step-verification>
2. Generate an App Password: <https://myaccount.google.com/apppasswords>
   (choose "Mail" as the app). Copy the 16-character password.
3. You'll use your Gmail address as `GMAIL_USER` and this app password as
   `GMAIL_APP_PASSWORD`.

## 4. Fill in your environment

```bash
cp .env.example .env
```

Fill in every value — see [`.env.example`](.env.example) for what each one is
and where to get it. In particular:
- `ADMIN_PASSWORD` — pick a **real, strong password**. This app is deployed
  publicly; don't leave this as a placeholder.
- `APP_URL` — your Vercel production URL, no trailing slash (leave the
  default for local testing against a deployed backend, or fill in once you
  know it after step 6).

## 5. Local development

```bash
npm install
npm install -g vercel   # one-time, free CLI — needed to run the /api functions locally
vercel dev               # serves the React app AND /api/* together
```

`vercel dev` will ask you to log in / link a project the first time (free,
just needs a Vercel account) — after that it reads `.env` automatically and
serves everything at **http://localhost:3000**.

If you only want the frontend (no email/API testing), `npm run dev` alone
works too (Vite on port 5173), but every `/api/*` call will 404.

## 6. Deploy (free, no server to manage)

1. Push this repo to GitHub.
2. In the Vercel dashboard: **Add New → Project → Import** your GitHub repo.
   Vercel auto-detects Vite + the `/api` folder — no config needed.
3. Add every variable from your `.env` file under **Project Settings →
   Environment Variables**.
4. Deploy. You'll get a public `https://userforge-xxxx.vercel.app` URL.
5. Set `APP_URL` (in Vercel env vars) and Supabase's **Site URL** (step 2.4)
   to this exact URL, then redeploy.
6. Every future `git push` to your default branch auto-redeploys.

## 7. Set up "create/delete user via GitHub issue"

Opening a **"👤 New User Request"** or **"🗑️ Delete User Request"** issue (from
the *Issues → New issue* picker) creates/deletes a real user through the same
path as the admin UI — invite email included. **Only issues opened by a repo
owner or collaborator are processed** — anyone else's request gets closed
with an "unauthorized" comment and nothing happens.

Setup (one-time):

1. Generate a random secret, e.g. `openssl rand -hex 32`.
2. Add it in **two places** with the exact same value:
   - Vercel: **Project Settings → Environment Variables** → `INTERNAL_API_SECRET`
   - GitHub: **repo Settings → Secrets and variables → Actions → Secrets tab**
     → **New repository secret** → name `INTERNAL_API_SECRET`
3. Also add a GitHub repo **variable** (not secret): **Settings → Secrets and
   variables → Actions → Variables tab** → **New repository variable** →
   name `VERCEL_APP_URL`, value your production URL (no trailing slash).
4. Redeploy on Vercel so it picks up `INTERNAL_API_SECRET`.

Try it: **Issues → New issue → "👤 New User Request"**, fill in the form,
submit. Within a few seconds the Action comments on the issue with the
result and closes it.

## 8. Login/logout audit log

Every sign-in and sign-out (both regular users and admin) is recorded in the
private `login_audit` Supabase table — visible in-app under **Admin →
Audit Log**. It is **not** published to the wiki (this repo is public;
publishing real users' emails and activity there would be a privacy leak).

A scheduled workflow (`.github/workflows/audit-log-export.yml`, every 4
hours) also pulls the full log and uploads it as a **private GitHub Actions
artifact** — downloadable only by people with repo access, auto-expires
after 30 days. It reuses the `INTERNAL_API_SECRET` / `VERCEL_APP_URL` you
already set up in step 7 — no extra setup needed.

## Project structure

```
userforge/
├── src/
│   ├── App.jsx                    # auth-state routing: login / set-password / user / admin
│   ├── components/
│   │   ├── Login.jsx, SetPassword.jsx        # auth screens
│   │   ├── UserPortal.jsx                    # regular user's tabbed shell (department / leave / provisioning)
│   │   ├── DepartmentUsers.jsx               # regular user's read-only department view
│   │   ├── LeaveRequestForm.jsx, ProvisioningRequestForm.jsx
│   │   ├── UserList, AddUser, BulkUpload,    # admin views
│   │   │   EditDeleteUser, ExportData, AdminAuditLog,
│   │   │   AdminLeaveRequests, AdminProvisioningRequests
│   │   └── Sidebar.jsx, EmptyState.jsx
│   ├── lib/
│   │   ├── supabaseClient.js    # Supabase client init
│   │   ├── auth.js               # regular-user session handling, own-department/leave/provisioning reads
│   │   ├── adminApi.js           # admin-token-authenticated calls to /api/admin-*
│   │   ├── validation.js         # email/phone/required-field validation
│   │   ├── csvExcel.js           # CSV/Excel parsing, validation, export, template
│   │   ├── fileUtils.js          # File -> base64 for attachment uploads
│   │   └── statusBadge.js        # shared pending/approved/rejected -> badge-class mapping
│   └── assets/                   # logo.svg, empty-state.svg
├── api/
│   ├── _supabaseAdmin.js         # server-side Supabase client (service_role key, bypasses RLS)
│   ├── _adminAuth.js             # stateless HMAC-signed admin session tokens
│   ├── _requireUser.js           # verifies a caller's Supabase session server-side
│   ├── _mailer.js                 # Nodemailer/Gmail: activation + welcome email builders
│   ├── _validation.js            # shared create-payload normalization
│   ├── _attachments.js           # provisioning categories, allowed file types, size limit
│   ├── _userCreation.js          # shared create-with-activation / delete-with-auth-cleanup logic
│   ├── admin-login.js, admin-users.js, admin-audit-log.js
│   ├── create-user.js, bulk-create-users.js, update-user.js, delete-user.js
│   ├── record-login.js           # verifies caller (session token or admin token), logs the event
│   ├── export-audit-log.js       # secret-authenticated, used by the scheduled workflow
│   ├── github-user-request.js    # called only by the GitHub Action (secret-authenticated)
│   ├── submit-leave-request.js, admin-leave-requests.js, admin-decide-leave.js
│   ├── submit-provisioning-request.js, admin-provisioning-requests.js,
│   │   admin-decide-provisioning.js, attachment-url.js
│   └── health.js
├── .github/
│   ├── ISSUE_TEMPLATE/new-user-request.yml, delete-user-request.yml
│   └── workflows/
│       ├── ci.yml, codeql.yml, secret-scan.yml, pages.yml
│       ├── user-request-sync.yml     # GitHub-issue user requests
│       └── audit-log-export.yml      # every 4h, private artifact
├── supabase/
│   ├── schema.sql                        # full state, for a brand new project
│   ├── migration_002_auth_and_audit.sql       # incremental diff
│   └── migration_003_leave_and_provisioning.sql  # incremental diff
├── tests/                             # Vitest unit tests
└── .env.example
```

## Features

- **Admin**: full Create / Read / Update / Delete, search & filter, bulk
  CSV/Excel import with per-row validation preview, CSV/Excel export, and a
  login/logout audit log — all gated behind an admin password (`ADMIN_PASSWORD`)
- **Regular users**: sign in with the password they set via their invite
  link, see only the users in their own department (enforced by Postgres RLS,
  not just hidden in the UI)
- **Activation-based onboarding**: every newly created user (via the admin UI,
  bulk upload, or a GitHub issue) gets a branded email with their department/
  role, a randomly-generated temporary password, and a one-time activation
  link to sign in and immediately replace it with their own
- **Create/delete via GitHub issue** — repo owners/collaborators only (see
  setup step 7)
- **Login/logout audit log** — private Supabase table, admin-only in-app view,
  plus a 4-hourly export to a private GitHub Actions artifact (see step 8)
- **Leave requests** — any signed-in user can submit a date-range + reason
  request from their own portal; admins see and approve/reject every
  request, users see only their own with the status and admin's note
- **Provisioning requests** — users request stationary, access,
  transportation, medical, food, accommodation, or gift-card provisioning,
  with an amount spent/claimed and an optional attachment (image, PDF, Word,
  Excel, or text, max 5MB). Admins approve or reject with an approved/
  rejected amount and a reason; users see only their own requests. Both
  request types are private data — see the security notes below
- **CI/CD**: unit tests + coverage (Vitest), CodeQL, Dependabot, secret
  scanning (Gitleaks), all reported on a [live dashboard](#cicd) published to
  GitHub Pages

## CI/CD

Every push/PR to `main`/`develop`/`feature/**` runs:
- **CI** — Vitest unit tests + coverage, plus a production build sanity check
- **CodeQL** — static security analysis (JavaScript/TypeScript)
- **Secret Scan** — [Gitleaks](https://github.com/gitleaks/gitleaks) scans the
  full history for accidentally committed credentials (this workflow **fails
  the build** on a real finding — unlike the other scans, a leaked secret is
  a binary incident, not a code-quality nit). Also turn on GitHub's own
  **Settings → Security → Secret scanning** (a platform feature, not
  something a workflow file can enable) for push-protection on top of this.
- **Pages** — rebuilds the CI/CD metrics dashboard (coverage %, CodeQL/Dependabot
  alert counts, secret-scan findings) at `https://<you>.github.io/<repo>/`

Dependabot opens weekly PRs against `develop` for outdated npm and GitHub
Actions dependencies (only active once `.github/dependabot.yml` reaches the
default branch — GitHub only reads that file from there).

**Test coverage note:** unit tests currently cover the pure logic modules
(`src/lib/validation.js`, `src/lib/csvExcel.js`, `api/_mailer.js`,
`api/_validation.js`) — not React component rendering. Component-level tests
(React Testing Library + jsdom) are a good next step; see the roadmap below.

## Security notes

- There is **no anon-role policy** on the `users` table anymore — the public
  anon key (which ships in the browser bundle by necessity) grants zero
  direct table access. Regular users authenticate via Supabase Auth and can
  only `SELECT` rows in their own department (RLS, enforced in Postgres, not
  just hidden in the UI). All writes go through `/api` routes using the
  service_role key.
- `ADMIN_PASSWORD` gates the admin view. Username is always `"admin"`, but
  the password is whatever you set — **do not leave it as a placeholder**,
  this app is deployed publicly. Sessions are stateless HMAC-signed tokens
  (8-hour expiry), verified server-side on every admin API call.
- `/api/github-user-request`, `/api/export-audit-log` require a shared secret
  header (`INTERNAL_API_SECRET`) that only your own GitHub Actions know.
  `user-request-sync.yml` additionally refuses to act on issues from anyone
  who isn't a repo owner/member/collaborator.
- New users **do** receive a temporary password by email (generated with
  Node's `crypto.randomBytes`, `api/_password.js`), plus a one-time
  activation link to replace it. This is a deliberate, less-safe tradeoff
  than a pure magic-link invite (which this app used until this point) —
  chosen explicitly rather than defaulted to. The temp password is never
  logged or persisted anywhere by this app beyond being set as the user's
  initial Supabase Auth password (which Supabase stores hashed, same as any
  password change after). Whatever password the user sets after following
  the link is entirely theirs — this app never sees or stores it either way.
- Login/logout audit data stays out of the public wiki on purpose (see step 8).
- **Leave and provisioning request data stays private too, for the same
  reason** — reasons for leave, medical bills, expense amounts, and
  attachments belong to real people. `leave_requests` and
  `provisioning_requests` have RLS `SELECT` policies scoped to the requester's
  own rows only; nothing is exported to the wiki. Attachments live in a
  **private** Supabase Storage bucket (`public: false`, no anon/authenticated
  policies) — the only way to read one is `/api/attachment-url`, which
  issues a 5-minute signed URL after checking the caller is either the
  requester (verified session token) or an admin.
- File uploads are validated against an allow-list of MIME types (image/PDF/
  Word/Excel/text) and a 5MB size cap, both client-side (fast feedback) and
  server-side (`api/_attachments.js`, the actual enforcement — never trust
  client-side-only checks). There's no deep content/virus scanning; if you
  need that, look at Supabase Storage's upload hooks or an external scanning
  service before trusting uploaded files further.

## Suggested next steps for Prometheus + Grafana dashboards

Prometheus itself is a poor fit here: it works by *scraping* a metrics
endpoint on a long-running process at a fixed interval, and this app has no
such process — Vercel functions are stateless and ephemeral, spun up per
request. Standing up something for Prometheus to scrape would mean adding
infrastructure this app deliberately doesn't have.

What actually fits the free-tier, serverless shape of this stack:

1. **Grafana Cloud (free tier) + a Postgres data source pointed at Supabase.**
   Supabase Postgres is directly queryable by Grafana's built-in Postgres
   plugin — no exporter, no scraping, no extra service. You'd build panels
   directly on SQL queries against `users` and `login_audit`, e.g.:
   - Users by department / role / status (simple `GROUP BY` panels)
   - Signups over time (`date_trunc('day', created_at)` time series)
   - Daily active users from `login_audit` (`event = 'login'`, grouped by day)
   - Failed-vs-successful invite email rate, if you start logging that
     (see roadmap below)
   Supabase's connection pooler (Session mode, port 5432, or Transaction
   mode/pgbouncer on 6543) works fine as Grafana's Postgres connection string;
   use a **read-only Postgres role** for this, not the service_role key.
2. **Vercel's own Web Analytics / Speed Insights** (free tier available) for
   request volume, latency, and error rate on the `/api/*` functions — this
   covers the "operational metrics" half that Prometheus would otherwise be
   for, without needing your own scrape target.
3. If you outgrow the free tiers and want real Prometheus-style metrics from
   the `/api` functions themselves (request counts, latencies, error rates
   per route), the practical path on a serverless platform is usually
   **push-based**, not scrape-based: emit metrics from each function to a
   hosted collector (e.g., Grafana Cloud's Prometheus remote-write endpoint,
   or a service like Axiom/Better Stack) rather than trying to run Prometheus
   itself anywhere.

Net recommendation: start with **Grafana Cloud + Supabase Postgres data
source** (near-zero setup, genuinely free, no infrastructure to run) and only
reach for a metrics-collector/push setup if you specifically need per-request
API latency/error dashboards later.

## Enhancement roadmap

Roughly in order of value-for-effort:

1. **Component-level frontend tests** (React Testing Library + jsdom) for
   `Login`, `SetPassword`, `AddUser`, `BulkUpload` — current tests only cover
   pure `lib`/`api` logic, not rendering/interaction.
2. **Password reset ("forgot password") flow** for regular users — currently
   only the initial invite link exists; `supabase.auth.resetPasswordForEmail`
   is a small addition reusing the same `SetPassword` screen.
3. **Rate limiting** on `/api/admin-login` (a handful of failed attempts per
   IP per minute) — the HMAC token design is sound, but the login endpoint
   itself has no brute-force protection yet.
4. **Structured logging for email delivery** (a small `email_log` table:
   recipient, type, sent/failed, error) — turns the Grafana suggestion above
   from "possible" into "one more panel."
5. **Admin roles beyond one shared password** — right now every admin shares
   one password with no per-admin identity. If more than one person needs
   admin access, migrate the admin login to Supabase Auth too, with a
   `is_admin` boolean/role column instead of a separate credential system.
6. **Self-service department transfer requests** — regular users can already
   see their department; a natural next step is letting them request a
   department change (creates a pending request an admin approves), instead
   of requiring an admin to edit it directly.
7. **Bulk delete / bulk status change** in the admin UI, mirroring the
   existing bulk-import flow.
