import { useState } from "react";
import { UserPlus } from "lucide-react";

import { adminCreateUser } from "../lib/adminApi";
import { DEPARTMENTS, ROLES, STATUSES } from "../lib/constants";
import { validateUserForm } from "../lib/validation";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  age: 25,
  department: DEPARTMENTS[0],
  role: ROLES[0],
  status: "Active",
};

export default function AddUser({ onUserAdded }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState([]);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    // Format/required-field checks only -- duplicate-email checking now
    // happens server-side (the anon key has no read access to the users
    // table anymore; RLS restricts it to each signed-in user's own
    // department).
    const validationErrors = await validateUserForm({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setSubmitting(false);
      return;
    }
    setErrors([]);

    try {
      const result = await adminCreateUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        age: Number(form.age),
        department: form.department,
        role: form.role,
        status: form.status,
      });

      let message = `User '${form.fullName}' added successfully.`;
      if (result.emailSent) {
        message += ` 📧 Invite email sent to ${form.email.trim()}.`;
      } else if (result.emailError) {
        message += ` (Invite email not sent: ${result.emailError})`;
      }

      setAlert({ kind: "success", message });
      setForm(initialForm);
      onUserAdded();
    } catch (err) {
      setAlert({ kind: "error", message: err.message || "Failed to add user." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">
        <UserPlus size={22} /> Add New User
      </h2>

      {alert && <div className={`alert alert-${alert.kind}`}>{alert.message}</div>}
      {errors.map((err) => (
        <div className="alert alert-error" key={err}>
          {err}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <div className="field">
              <label htmlFor="add-fullName">Full Name *</label>
              <input id="add-fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="add-email">Email *</label>
              <input id="add-email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="add-phone">Phone</label>
              <input id="add-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>
          <div>
            <div className="field">
              <label htmlFor="add-age">Age</label>
              <input
                id="add-age"
                type="number"
                min={0}
                max={120}
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="add-department">Department</label>
              <select id="add-department" value={form.department} onChange={(e) => update("department", e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="add-role">Role</label>
              <select id="add-role" value={form.role} onChange={(e) => update("role", e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="field">
          <label>Status</label>
          <div className="radio-row">
            {STATUSES.map((s) => (
              <label key={s}>
                <input
                  type="radio"
                  name="status"
                  checked={form.status === s}
                  onChange={() => update("status", s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          <UserPlus size={16} />
          {submitting ? "Adding…" : "Add User"}
        </button>
      </form>
    </div>
  );
}
