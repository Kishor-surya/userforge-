import { useEffect, useState } from "react";
import { UserCog, Save, Trash2 } from "lucide-react";

import { deleteUser, emailExists, updateUser } from "../lib/api";
import { DEPARTMENTS, ROLES, STATUSES } from "../lib/constants";
import { validateUserForm } from "../lib/validation";
import EmptyState from "./EmptyState";

export default function EditDeleteUser({ users, onUserChanged }) {
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? "");
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState([]);
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (users.length === 0) {
      setSelectedId("");
      setForm(null);
      return;
    }
    const stillExists = users.some((u) => u.id === selectedId);
    const target = stillExists ? users.find((u) => u.id === selectedId) : users[0];
    setSelectedId(target.id);
    setForm({
      fullName: target.full_name,
      email: target.email,
      phone: target.phone || "",
      age: target.age || 0,
      department: target.department,
      role: target.role,
      status: target.status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  function selectUser(id) {
    const target = users.find((u) => u.id === Number(id));
    setSelectedId(target.id);
    setForm({
      fullName: target.full_name,
      email: target.email,
      phone: target.phone || "",
      age: target.age || 0,
      department: target.department,
      role: target.role,
      status: target.status,
    });
    setErrors([]);
    setAlert(null);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setBusy(true);
    setAlert(null);

    const validationErrors = await validateUserForm({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      checkDuplicate: (email) => emailExists(email, selectedId),
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setBusy(false);
      return;
    }
    setErrors([]);

    try {
      await updateUser(selectedId, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        age: Number(form.age),
        department: form.department,
        role: form.role,
        status: form.status,
      });
      setAlert({ kind: "success", message: "User updated successfully." });
      onUserChanged();
    } catch (err) {
      setAlert({ kind: "error", message: err.message || "Update failed." });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setAlert(null);
    try {
      await deleteUser(selectedId);
      setAlert({ kind: "success", message: "User deleted successfully." });
      onUserChanged();
    } catch (err) {
      setAlert({ kind: "error", message: err.message || "Delete failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">
        <UserCog size={22} /> Edit / Delete User
      </h2>

      {users.length === 0 || !form ? (
        <EmptyState message="No users available yet. Add a user first." />
      ) : (
        <>
          <div className="field" style={{ maxWidth: 420 }}>
            <label>Select a user</label>
            <select value={selectedId} onChange={(e) => selectUser(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email}) — id {u.id}
                </option>
              ))}
            </select>
          </div>

          {alert && <div className={`alert alert-${alert.kind}`}>{alert.message}</div>}
          {errors.map((err) => (
            <div className="alert alert-error" key={err}>
              {err}
            </div>
          ))}

          <form onSubmit={handleUpdate}>
            <div className="form-grid">
              <div>
                <div className="field">
                  <label>Full Name *</label>
                  <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
                </div>
                <div className="field">
                  <label>Email *</label>
                  <input value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
              </div>
              <div>
                <div className="field">
                  <label>Age</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={form.age}
                    onChange={(e) => update("age", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Department</label>
                  <select value={form.department} onChange={(e) => update("department", e.target.value)}>
                    {DEPARTMENTS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Role</label>
                  <select value={form.role} onChange={(e) => update("role", e.target.value)}>
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
                      name="edit-status"
                      checked={form.status === s}
                      onChange={() => update("status", s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                <Save size={16} /> Update User
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
                <Trash2 size={16} /> Delete User
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
