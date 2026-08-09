import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";

import { adminDecideProvisioning, adminGetAttachmentUrl, adminGetProvisioningRequests } from "../lib/adminApi";
import { PROVISIONING_CATEGORIES } from "../lib/constants";
import { statusBadgeClass } from "../lib/statusBadge";
import EmptyState from "./EmptyState";

export default function AdminProvisioningRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    adminGetProvisioningRequests()
      .then(setRequests)
      .catch((err) => setError(err.message || "Failed to load provisioning requests."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(request, decision) {
    let approvedAmount;
    let rejectedAmount;
    let reason = null;

    if (decision === "approved") {
      const input = window.prompt("Approved amount?", String(request.claimed_amount));
      if (input === null) return;
      approvedAmount = Number(input);
      if (!Number.isFinite(approvedAmount) || approvedAmount < 0) {
        setError("Approved amount must be a valid non-negative number.");
        return;
      }
    } else {
      const input = window.prompt("Rejected amount?", String(request.claimed_amount));
      if (input === null) return;
      rejectedAmount = Number(input);
      if (!Number.isFinite(rejectedAmount) || rejectedAmount < 0) {
        setError("Rejected amount must be a valid non-negative number.");
        return;
      }
      reason = window.prompt("Reason for rejecting this request?") || "";
    }

    setBusyId(request.id);
    try {
      await adminDecideProvisioning(request.id, decision, { approvedAmount, rejectedAmount, reason });
      load();
    } catch (err) {
      setError(err.message || "Failed to update request.");
    } finally {
      setBusyId(null);
    }
  }

  async function viewAttachment(requestId) {
    try {
      const { url } = await adminGetAttachmentUrl(requestId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Could not open attachment.");
    }
  }

  return (
    <div>
      <h2 className="page-title">
        <Receipt size={22} /> Provisioning Requests
      </h2>
      <p className="page-caption">All provisioning/expense requests from every user, across every department.</p>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="caption">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState message="No provisioning requests yet." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Requester</th>
                <th>Category</th>
                <th>Description</th>
                <th>Spent</th>
                <th>Claimed</th>
                <th>Approved</th>
                <th>Rejected</th>
                <th>Status</th>
                <th>Admin note</th>
                <th>Attachment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.requester_name} ({r.requester_email})
                  </td>
                  <td>{PROVISIONING_CATEGORIES.find((c) => c.key === r.category)?.label || r.category}</td>
                  <td>{r.description}</td>
                  <td>{r.amount_spent}</td>
                  <td>{r.claimed_amount}</td>
                  <td>{r.approved_amount ?? ""}</td>
                  <td>{r.rejected_amount ?? ""}</td>
                  <td>
                    <span className={`badge badge-${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td>{r.admin_reason || ""}</td>
                  <td>
                    {r.attachment_path ? (
                      <button type="button" className="btn" onClick={() => viewAttachment(r.id)}>
                        View
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {r.status === "pending" ? (
                      <div className="btn-row" style={{ marginTop: 0 }}>
                        <button
                          className="btn btn-primary"
                          disabled={busyId === r.id}
                          onClick={() => decide(r, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          disabled={busyId === r.id}
                          onClick={() => decide(r, "rejected")}
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
