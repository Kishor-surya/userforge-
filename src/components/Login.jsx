import { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";

import logoUrl from "../assets/logo.svg";
import { adminLogin } from "../lib/adminApi";
import { signInWithPassword } from "../lib/auth";

export default function Login({ onAdminLoggedIn, onUserLoggedIn }) {
  const [mode, setMode] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleUserSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password);
      onUserLoggedIn();
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdminSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminLogin(username.trim(), adminPassword);
      onAdminLoggedIn();
    } catch (err) {
      setError(err.message || "Admin sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="logo-row" style={{ justifyContent: "center" }}>
          <img src={logoUrl} alt="" width={40} height={40} />
          <h1>UserForge</h1>
        </div>

        <div className="login-tabs">
          <button type="button" className={mode === "user" ? "active" : ""} onClick={() => setMode("user")}>
            Sign in
          </button>
          <button type="button" className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>
            Admin
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {mode === "user" ? (
          <form onSubmit={handleUserSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%" }}>
              <LogIn size={16} />
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="caption">New here? Check your email for an invite link from UserForge.</p>
          </form>
        ) : (
          <form onSubmit={handleAdminSubmit}>
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%" }}>
              <ShieldCheck size={16} />
              {busy ? "Signing in…" : "Admin sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
