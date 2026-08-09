import { ClipboardList, LogOut } from "lucide-react";

import logoUrl from "../assets/logo.svg";
import EmptyState from "./EmptyState";

export default function DepartmentUsers({ users, loading, loadError, onLogout }) {
  return (
    <div className="main-content" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="logo-row">
          <img src={logoUrl} alt="" width={36} height={36} />
          <h1>UserForge</h1>
        </div>
        <button className="btn" onClick={onLogout}>
          <LogOut size={16} /> Log out
        </button>
      </div>

      <h2 className="page-title">
        <ClipboardList size={22} /> My Department
      </h2>
      <p className="page-caption">You can see other users in your own department only.</p>

      {loadError && <div className="alert alert-error">{loadError}</div>}

      {loading ? (
        <p className="caption">Loading…</p>
      ) : users.length === 0 ? (
        <EmptyState message="No other users found in your department yet." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td>{u.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
