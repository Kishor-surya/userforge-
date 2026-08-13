import { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";

import logoUrl from "../assets/logo.svg";
import { adminLogin } from "../lib/adminApi";
import { requestPasswordReset, signInWithPassword } from "../lib/auth";

export default function Login({ onAdminLoggedIn, onUserLoggedIn }) {
  const [mode, setMode] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState(null); // null | "sending" | "sent"
  const [forgotError, setForgotError] = useState(null);

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

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotStatus("sending");
    setForgotError(null);
    try {
      await requestPasswordReset(forgotEmail.trim());
      setForgotStatus("sent");
    } catch (err) {
      setForgotError(err.message || "Could not send reset email.");
      setForgotStatus(null);
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
          <button
            type="button"
            aria-label="Show sign-in form"
            className={mode === "user" ? "active" : ""}
            onClick={() => setMode("user")}
          >
            Sign in
          </button>
          <button
            type="button"
            aria-label="Show admin sign-in form"
            className={mode === "admin" ? "active" : ""}
            onClick={() => setMode("admin")}
          >
            Admin
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {mode === "user" ? (
          <form onSubmit={handleUserSubmit}>
            <div className="field">
              <label htmlFor="user-email">Email</label>
              <input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="user-password">Password</label>
              <input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%" }}>
              <LogIn size={16} />
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="caption">New here? Check your email for an invite link from UserForge.</p>

            {!showForgot ? (
              <button type="button" className="link-btn" onClick={() => setShowForgot(true)}>
                Forgot password?
              </button>
            ) : forgotStatus === "sent" ? (
              <p className="caption">If that email has an account, a password reset link has been sent.</p>
            ) : (
              <div className="forgot-form">
                {forgotError && <div className="alert alert-error">{forgotError}</div>}
                <div className="field">
                  <label htmlFor="forgot-email">Email to reset</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  className="btn"
                  type="button"
                  disabled={forgotStatus === "sending"}
                  style={{ width: "100%" }}
                  onClick={handleForgotSubmit}
                >
                  {forgotStatus === "sending" ? "Sending…" : "Send reset link"}
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleAdminSubmit}>
            <div className="field">
              <label htmlFor="admin-username">Username</label>
              <input id="admin-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
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
