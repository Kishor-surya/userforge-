import { useState } from "react";
import { Upload, Download } from "lucide-react";

import { bulkInsertUsers, emailExists } from "../lib/api";
import { downloadBlob, parseUploadFile, uploadTemplateBlob, validateUploadRows } from "../lib/csvExcel";
import { sendWelcomeEmail } from "../lib/emailClient";

export default function BulkUpload({ onUsersImported }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setError(null);
    setAlert(null);
    setRows([]);

    try {
      const rawRows = await parseUploadFile(file);
      const validated = await validateUploadRows(rawRows, (email) => emailExists(email));
      setRows(validated);
    } catch (err) {
      setError(err.message || "Could not read that file. Make sure it's a valid CSV or Excel file.");
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  }

  const validCount = rows.filter((r) => r.valid).length;

  async function handleImport() {
    setImporting(true);
    setAlert(null);
    try {
      const validRows = rows.filter((r) => r.valid);
      const created = await bulkInsertUsers(validRows);

      let sentCount = 0;
      let failedCount = 0;
      for (const u of created) {
        const { sent } = await sendWelcomeEmail({
          email: u.email,
          fullName: u.full_name,
          department: u.department,
          role: u.role,
        });
        if (sent) sentCount += 1;
        else failedCount += 1;
      }

      let message = `Imported ${created.length} user(s) successfully.`;
      message += ` 📧 Sent ${sentCount} welcome email(s).`;
      if (failedCount) message += ` ${failedCount} failed.`;

      setAlert({ kind: "success", message });
      setRows([]);
      onUsersImported();
    } catch (err) {
      setAlert({ kind: "error", message: err.message || "Import failed." });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">
        <Upload size={22} /> Bulk Upload Users
      </h2>
      <p className="page-caption">
        Upload a CSV or Excel file with a <code>full_name</code> and <code>email</code> column (optionally{" "}
        <code>phone</code>, <code>age</code>, <code>department</code>, <code>role</code>, <code>status</code>).
      </p>

      <button
        className="btn"
        onClick={() => downloadBlob(uploadTemplateBlob(), "user_upload_template.xlsx")}
      >
        <Download size={16} /> Download template
      </button>

      <div className="field" style={{ marginTop: "1rem" }}>
        <label>Choose a CSV or Excel file</label>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} disabled={parsing} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {alert && <div className={`alert alert-${alert.kind}`}>{alert.message}</div>}

      {rows.length > 0 && (
        <>
          <p>
            <strong>{rows.length} row(s) found</strong> — {validCount} valid, {rows.length - validCount} with
            errors.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Valid</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Age</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${r.valid ? "badge-valid" : "badge-invalid"}`}>
                        {r.valid ? "Valid" : "Invalid"}
                      </span>
                    </td>
                    <td>{r.fullName}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                    <td>{r.age}</td>
                    <td>{r.department}</td>
                    <td>{r.role}</td>
                    <td>{r.status}</td>
                    <td>{r.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validCount > 0 ? (
            <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={handleImport} disabled={importing}>
              <Upload size={16} />
              {importing ? "Importing…" : `Import ${validCount} valid user(s)`}
            </button>
          ) : (
            <div className="alert alert-warning" style={{ marginTop: "1rem" }}>
              No valid rows to import.
            </div>
          )}
        </>
      )}
    </div>
  );
}
