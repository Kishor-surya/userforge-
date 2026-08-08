import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import { DEPARTMENTS, STATUSES } from "../lib/constants";
import EmptyState from "./EmptyState";

export default function UserList({ users }) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        const matches = u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (deptFilter !== "All" && u.department !== deptFilter) return false;
      if (statusFilter !== "All" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, deptFilter, statusFilter]);

  return (
    <div>
      <h2 className="page-title">
        <ClipboardList size={22} /> User List
      </h2>

      {users.length === 0 ? (
        <EmptyState message="No users yet — add one from the Add User page." />
      ) : (
        <>
          <div className="toolbar">
            <div className="field">
              <label>Search by name or email</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
            </div>
            <div className="field">
              <label>Department</label>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option>All</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All</option>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Age</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>{u.age}</td>
                    <td>{u.department}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption">
            Showing {filtered.length} of {users.length} user(s).
          </p>
        </>
      )}
    </div>
  );
}
