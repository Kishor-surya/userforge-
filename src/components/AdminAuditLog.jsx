import { useEffect, useState } from "react";
import { History } from "lucide-react";

import { adminGetAuditLog } from "../lib/adminApi";
import EmptyState from "./EmptyState";

export default function AdminAuditLog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminGetAuditLog()
      .then(setEvents)
      .catch((err) => setError(err.message || "Failed to load audit log."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="page-title">
        <History size={22} /> Login / Logout Audit Log
      </h2>
      <p className="page-caption">
        Most recent 500 events, admin-only. Also exported every 4 hours to a private GitHub Actions artifact
        (see .github/workflows/audit-log-export.yml) — not published to the wiki, since this repo is public.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="caption">Loading…</p>
      ) : events.length === 0 ? (
        <EmptyState message="No login/logout events recorded yet." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Event</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.user_email}</td>
                  <td>{e.event}</td>
                  <td>{new Date(e.occurred_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
