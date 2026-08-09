import { useCallback, useEffect, useState } from "react";

import AddUser from "./components/AddUser";
import AdminAuditLog from "./components/AdminAuditLog";
import BulkUpload from "./components/BulkUpload";
import DepartmentUsers from "./components/DepartmentUsers";
import EditDeleteUser from "./components/EditDeleteUser";
import ExportData from "./components/ExportData";
import Login from "./components/Login";
import SetPassword from "./components/SetPassword";
import Sidebar from "./components/Sidebar";
import UserList from "./components/UserList";
import { adminGetAllUsers, adminLogout, adminRecordLogin, getAdminToken } from "./lib/adminApi";
import { getMyDepartmentUsers, getSession, signOut } from "./lib/auth";

function isInviteOrRecoveryUrl() {
  return /type=(invite|recovery)/.test(window.location.hash);
}

export default function App() {
  // "loading" | "needsPassword" | "anon" | "user" | "admin"
  const [authStatus, setAuthStatus] = useState("loading");
  const [page, setPage] = useState("list");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    (async () => {
      const pendingSetPassword = isInviteOrRecoveryUrl();
      const session = await getSession();

      if (session && pendingSetPassword) {
        setAuthStatus("needsPassword");
      } else if (session) {
        setAuthStatus("user");
      } else if (getAdminToken()) {
        setAuthStatus("admin");
      } else {
        setAuthStatus("anon");
      }
    })();
  }, []);

  const refresh = useCallback(() => {
    if (authStatus !== "admin" && authStatus !== "user") return;
    setLoading(true);
    const fetcher = authStatus === "admin" ? adminGetAllUsers : getMyDepartmentUsers;
    fetcher()
      .then((data) => {
        setUsers(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err.message || "Failed to load users."))
      .finally(() => setLoading(false));
  }, [authStatus]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdminLoggedIn() {
    await adminRecordLogin();
    setPage("list");
    setAuthStatus("admin");
  }

  function handleUserLoggedIn() {
    setAuthStatus("user");
  }

  function handlePasswordSet() {
    window.history.replaceState(null, "", window.location.pathname);
    setAuthStatus("user");
  }

  async function handleLogout() {
    if (authStatus === "admin") {
      await adminLogout();
    } else {
      await signOut();
    }
    setUsers([]);
    setAuthStatus("anon");
  }

  if (authStatus === "loading") {
    return (
      <div className="login-screen">
        <p className="caption">Loading…</p>
      </div>
    );
  }

  if (authStatus === "needsPassword") {
    return <SetPassword onDone={handlePasswordSet} />;
  }

  if (authStatus === "anon") {
    return <Login onAdminLoggedIn={handleAdminLoggedIn} onUserLoggedIn={handleUserLoggedIn} />;
  }

  if (authStatus === "user") {
    return <DepartmentUsers users={users} loading={loading} loadError={loadError} onLogout={handleLogout} />;
  }

  // authStatus === "admin"
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onNavigate={setPage}
        totalUsers={totalUsers}
        activeUsers={activeUsers}
        onLogout={handleLogout}
      />
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
            {page === "audit" && <AdminAuditLog />}
          </>
        )}
      </main>
    </div>
  );
}
