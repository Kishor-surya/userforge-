import { Download } from "lucide-react";

import { downloadBlob, usersToCsvBlob, usersToXlsxBlob } from "../lib/csvExcel";
import EmptyState from "./EmptyState";

export default function ExportData({ users }) {
  return (
    <div>
      <h2 className="page-title">
        <Download size={22} /> Export User Data
      </h2>

      {users.length === 0 ? (
        <EmptyState message="No users to export yet." />
      ) : (
        <>
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
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
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
                    <td>{u.updated_at ? new Date(u.updated_at).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="btn-row">
            <button className="btn" onClick={() => downloadBlob(usersToCsvBlob(users), "users.csv")}>
              <Download size={16} /> Download as CSV
            </button>
            <button className="btn" onClick={() => downloadBlob(usersToXlsxBlob(users), "users.xlsx")}>
              <Download size={16} /> Download as Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
