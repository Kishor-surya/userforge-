import { useEffect, useState } from "react";
import {
  List,
  UserPlus,
  Upload,
  UserCog,
  Download,
  History,
  LogOut,
  Mail,
  CalendarDays,
  Receipt,
} from "lucide-react";

import logoUrl from "../assets/logo.svg";

export const PAGES = [
  { key: "list", label: "User List", icon: List },
  { key: "add", label: "Add User", icon: UserPlus },
  { key: "upload", label: "Bulk Upload", icon: Upload },
  { key: "edit", label: "Edit / Delete User", icon: UserCog },
  { key: "export", label: "Export Data", icon: Download },
  { key: "leave", label: "Leave Requests", icon: CalendarDays },
  { key: "provisioning", label: "Provisioning Requests", icon: Receipt },
  { key: "audit", label: "Audit Log", icon: History },
];

export default function Sidebar({ page, onNavigate, totalUsers, activeUsers, onLogout }) {
  const [emailStatus, setEmailStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setEmailStatus(data);
      })
      .catch(() => {
        if (!cancelled) setEmailStatus({ emailConfigured: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="sidebar">
      <div className="logo-row">
        <img src={logoUrl} alt="" width={40} height={40} />
        <h1>UserForge</h1>
      </div>
      <p className="tagline">Forge your team's roster.</p>

      <nav className="nav">
        {PAGES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-item ${page === key ? "active" : ""}`}
            onClick={() => onNavigate(key)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <hr className="sidebar-divider" />

      <div className="metrics">
        <div className="metric-card">
          <div className="metric-label">Total Users</div>
          <div className="metric-value">{totalUsers}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Users</div>
          <div className="metric-value">{activeUsers}</div>
        </div>
      </div>

      <hr className="sidebar-divider" />

      <div className="sidebar-footnote">
        <Mail size={13} style={{ verticalAlign: "-2px", marginRight: "0.3rem" }} />
        {emailStatus === null && "Checking welcome-email status…"}
        {emailStatus && emailStatus.emailConfigured && `Welcome emails enabled via ${emailStatus.smtpHost}`}
        {emailStatus && !emailStatus.emailConfigured && "Welcome emails not configured — see README."}
      </div>

      <button className="btn" style={{ marginTop: "0.75rem" }} onClick={onLogout}>
        <LogOut size={16} /> Log out (admin)
      </button>
    </aside>
  );
}
