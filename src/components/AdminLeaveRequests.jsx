import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { adminDecideLeave, adminGetLeaveRequests } from "../lib/adminApi";
import { statusBadgeClass } from "../lib/statusBadge";
import EmptyState from "./EmptyState";

export default function AdminLeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    adminGetLeaveRequests()
      .then(setRequests)
      .catch((err) => setError(err.message || "Failed to load leave requests."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id, decision) {
    let reason = null;
    if (decision === "rejected") {
      reason = window.prompt("Reason for rejecting this leave request?") || "";
    }
    setBusyId(id);
    try {
      await adminDecideLeave(id, decision, reason);
      load();
    } catch (err) {
      setError(err.message || "Failed to update request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2 className="page-title">
        <CalendarDays size={22} /> Leave Requests
      </h2>
      <p className="page-caption">All leave requests from every user, across every department.</p>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="caption">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState message="No leave requests yet." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Requester</th>
                <th>Start</th>
                <th>End</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Admin note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.requester_name} ({r.requester_email})
                  </td>
                  <td>{r.start_date}</td>
                  <td>{r.end_date}</td>
                  <td>{r.reason}</td>
                  <td>
                    <span className={`badge badge-${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td>{r.admin_reason || ""}</td>
                  <td>
                    {r.status === "pending" ? (
                      <div className="btn-row" style={{ marginTop: 0 }}>
                        <button
                          className="btn btn-primary"
                          disabled={busyId === r.id}
                          onClick={() => decide(r.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          disabled={busyId === r.id}
                          onClick={() => decide(r.id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
