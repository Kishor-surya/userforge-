import { useState } from "react";
import { KeyRound } from "lucide-react";

import { setPasswordAfterInvite } from "../lib/auth";

export default function SetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await setPasswordAfterInvite(password);
      onDone();
    } catch (err) {
      setError(err.message || "Could not set password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h2 className="page-title">
          <KeyRound size={22} /> Set your password
        </h2>
        <p className="page-caption">Welcome to UserForge! Choose a password to finish setting up your account.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Saving…" : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
