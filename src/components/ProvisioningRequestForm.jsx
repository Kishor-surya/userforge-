import { useEffect, useState } from "react";
import { Paperclip, Receipt } from "lucide-react";

import { getMyAttachmentUrl, getMyProvisioningRequests, submitProvisioningRequest } from "../lib/auth";
import { ATTACHMENT_ACCEPT, ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_BYTES, PROVISIONING_CATEGORIES } from "../lib/constants";
import { fileToBase64 } from "../lib/fileUtils";
import { statusBadgeClass } from "../lib/statusBadge";
import EmptyState from "./EmptyState";

const initialForm = {
  category: PROVISIONING_CATEGORIES[0].key,
  description: "",
  amountSpent: "",
  claimedAmount: "",
};

export default function ProvisioningRequestForm() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function loadRequests() {
    setLoading(true);
    getMyProvisioningRequests()
      .then(setRequests)
      .catch((err) => setAlert({ kind: "error", message: err.message || "Failed to load your requests." }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ATTACHMENT_MIME_TYPES.includes(selected.type)) {
      setAlert({ kind: "error", message: `Unsupported file type: ${selected.type || "unknown"}.` });
      e.target.value = "";
      setFile(null);
      return;
    }
    if (selected.size > MAX_ATTACHMENT_BYTES) {
      setAlert({ kind: "error", message: "File is too large (max 5MB)." });
      e.target.value = "";
      setFile(null);
      return;
    }
    setAlert(null);
    setFile(selected);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);
    setSubmitting(true);
    try {
      let fileBase64 = null;
      if (file) {
        fileBase64 = await fileToBase64(file);
      }
      await submitProvisioningRequest({
        category: form.category,
        description: form.description.trim(),
        amountSpent: form.amountSpent,
        claimedAmount: form.claimedAmount,
        fileBase64,
        fileName: file?.name,
        fileType: file?.type,
      });
      setAlert({ kind: "success", message: "Provisioning request submitted. Your admin will review it." });
      setForm(initialForm);
      setFile(null);
      loadRequests();
    } catch (err) {
      setAlert({ kind: "error", message: err.message || "Failed to submit request." });
    } finally {
      setSubmitting(false);
    }
  }

  async function viewAttachment(requestId) {
    try {
      const { url } = await getMyAttachmentUrl(requestId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setAlert({ kind: "error", message: err.message || "Could not open attachment." });
    }
  }

  return (
    <div>
      <h2 className="page-title">
        <Receipt size={22} /> Provisioning Request
      </h2>
      <p className="page-caption">
        Request reimbursement or provisioning for stationary, access, transportation, medical bills, food
        allowances, accommodation cost, or a gift card.
      </p>

      {alert && <div className={`alert alert-${alert.kind}`}>{alert.message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)}>
                {PROVISIONING_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Description</label>
              <input value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
          </div>
          <div>
            <div className="field">
              <label>Amount spent</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.amountSpent}
                onChange={(e) => update("amountSpent", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Claimed amount</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.claimedAmount}
                onChange={(e) => update("claimedAmount", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="field">
          <label>
            <Paperclip size={14} style={{ verticalAlign: "-2px" }} /> Attach a document (image, PDF, Word, Excel,
            or text — max 5MB)
          </label>
          <input type="file" accept={ATTACHMENT_ACCEPT} onChange={handleFileChange} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Provisioning Request"}
        </button>
      </form>

      <h3 style={{ marginTop: "2rem" }}>Your provisioning requests</h3>
      {loading ? (
        <p className="caption">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState message="No provisioning requests yet." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Spent</th>
                <th>Claimed</th>
                <th>Approved</th>
                <th>Rejected</th>
                <th>Status</th>
                <th>Admin note</th>
                <th>Attachment</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
