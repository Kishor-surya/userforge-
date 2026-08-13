# UserForge Grafana Dashboard

An importable dashboard covering the metrics described in the main
README's "Suggested next steps for Prometheus + Grafana dashboards"
section: total/active users, pending leave & provisioning requests,
signups over time, daily logins, users by department/role, provisioning
spend by category, email delivery success/failure, and failed admin
login attempts.

## 1. Create a read-only Postgres role for Grafana

Don't point Grafana at your `service_role` key or the app's own
credentials — create a dedicated role that can only `SELECT` the tables
this dashboard needs. Run in Supabase SQL Editor:

```sql
create role grafana_reader with login password 'CHOOSE-A-STRONG-PASSWORD';
grant usage on schema public to grafana_reader;
grant select on
  public.users,
  public.leave_requests,
  public.provisioning_requests,
  public.login_audit,
  public.email_log,
  public.admin_login_attempts
  to grafana_reader;
```

## 2. Get the connection string

Supabase → Project Settings → Database → **Connection string** → URI.
Use the **Session pooler** (port 5432) or **Transaction pooler** (port
6543) variant, not the raw direct connection — Vercel-style serverless
callers (and dashboard tools like Grafana) generally do better through
the pooler. Swap in `grafana_reader` and its password.

## 3. Add the data source in Grafana

Grafana Cloud (free tier) → Connections → Data sources → **Add new
data source** → PostgreSQL. Paste in the host/port/database/user/password
from the connection string. SSL mode: `require`.

## 4. Import the dashboard

Dashboards → **New → Import** → upload [`grafana-dashboard.json`](grafana-dashboard.json)
(or paste its contents) → when prompted for the `DS_POSTGRES` input,
select the data source you just created → Import.

## 5. (Optional) keep it current automatically

The dashboard auto-refreshes every 5 minutes by default (Grafana queries
Postgres live — no separate metrics pipeline needed, unlike Prometheus).
Adjust via the refresh-interval dropdown in the top right if you want it
faster/slower.
