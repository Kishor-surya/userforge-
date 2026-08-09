import { useState } from "react";
import { CalendarDays, ClipboardList, LogOut, Receipt } from "lucide-react";

import logoUrl from "../assets/logo.svg";
import DepartmentUsers from "./DepartmentUsers";
import LeaveRequestForm from "./LeaveRequestForm";
import ProvisioningRequestForm from "./ProvisioningRequestForm";

const TABS = [
  { key: "department", label: "My Department", icon: ClipboardList },
  { key: "leave", label: "Leave Request", icon: CalendarDays },
  { key: "provisioning", label: "Provisioning Request", icon: Receipt },
];

export default function UserPortal({ users, loading, loadError, onLogout }) {
  const [tab, setTab] = useState("department");

  return (
    <div className="main-content" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="logo-row">
          <img src={logoUrl} alt="" width={36} height={36} />
          <h1>UserForge</h1>
        </div>
        <button className="btn" onClick={onLogout}>
          <LogOut size={16} /> Log out
        </button>
      </div>

      <div className="login-tabs" style={{ marginBottom: "1.5rem" }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            <Icon size={15} style={{ verticalAlign: "-3px", marginRight: "0.35rem" }} />
            {label}
          </button>
        ))}
      </div>

      {tab === "department" && (
        <DepartmentUsersBody users={users} loading={loading} loadError={loadError} />
      )}
      {tab === "leave" && <LeaveRequestForm />}
      {tab === "provisioning" && <ProvisioningRequestForm />}
    </div>
  );
}

// DepartmentUsers already renders its own logo/logout header; reuse just its
// list body here by passing a no-op logout and hiding the header via props
// would be more invasive than simply inlining the list markup would be --
// so instead we keep DepartmentUsers usable standalone (still exported) and
// wrap it here without its header for the tabbed layout.
function DepartmentUsersBody({ users, loading, loadError }) {
  return <DepartmentUsers users={users} loading={loading} loadError={loadError} onLogout={null} embedded />;
}
