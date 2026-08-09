import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { getMyLeaveRequests, submitLeaveRequest } from "../lib/auth";
import { statusBadgeClass } from "../lib/statusBadge";
import EmptyState from "./EmptyState";

export default function LeaveRequestForm() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadRequests() {
    setLoading(true);
    getMyLeaveRequests()
      .then(setRequests)
      .catch((err) => setAlert({ kind: "error", message: err.message || "Failed to load your leave requests." }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);
    setSubmitting(true);
    try {
      await submitLeaveRequest({ startDate, endDate, reason: reason.trim() });
      setAlert({ kind: "success", message: "Leave request submitted. Your admin will review it." });
      setStartDate("");
      setEndDate("");
      setReason("");
      loadRequests();
    } catch (err) {
      setAlert({ kind: "error", message: err.message || "Failed to submit leave request." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">
        <CalendarDays size={22} /> Leave Request
      </h2>
      <p className="page-caption">Submit a leave request for your admin to review.</p>

      {alert && <div className={`alert alert-${alert.kind}`}>{alert.message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="field">
            <label>End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label>Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={{
              padding: "0.5rem 0.65rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: "0.92rem",
            }}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Leave Request"}
        </button>
      </form>

      <h3 style={{ marginTop: "2rem" }}>Your leave requests</h3>
      {loading ? (
        <p className="caption">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState message="No leave requests yet." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Start</th>
                <th>End</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Admin note</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.start_date}</td>
                  <td>{r.end_date}</td>
                  <td>{r.reason}</td>
                  <td>
                    <span className={`badge badge-${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td>{r.admin_reason || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
