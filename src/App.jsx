import { useCallback, useEffect, useState } from "react";

import AddUser from "./components/AddUser";
import BulkUpload from "./components/BulkUpload";
import EditDeleteUser from "./components/EditDeleteUser";
import ExportData from "./components/ExportData";
import Sidebar from "./components/Sidebar";
import UserList from "./components/UserList";
import { getAllUsers } from "./lib/api";

export default function App() {
  const [page, setPage] = useState("list");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    getAllUsers()
      .then((data) => {
        setUsers(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err.message || "Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} totalUsers={totalUsers} activeUsers={activeUsers} />
      <main className="main-content">
        {loadError && <div className="alert alert-error">{loadError}</div>}
        {loading ? (
          <p className="caption">Loading users…</p>
        ) : (
          <>
            {page === "list" && <UserList users={users} />}
            {page === "add" && <AddUser onUserAdded={refresh} />}
            {page === "upload" && <BulkUpload onUsersImported={refresh} />}
            {page === "edit" && <EditDeleteUser users={users} onUserChanged={refresh} />}
            {page === "export" && <ExportData users={users} />}
          </>
        )}
      </main>
    </div>
  );
}
