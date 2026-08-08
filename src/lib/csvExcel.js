import Papa from "papaparse";
import * as XLSX from "xlsx";

import { DEPARTMENTS, ROLES, STATUSES } from "./constants";
import { EMAIL_RE, PHONE_RE } from "./validation";

const COLUMN_ALIASES = {
  name: "full_name",
  full_name: "full_name",
  email: "email",
  email_address: "email",
  mobile: "phone",
  phone: "phone",
  phone_number: "phone",
  age: "age",
  department: "department",
  dept: "department",
  role: "role",
  status: "status",
};

function normalizeColumnName(name) {
  const key = String(name).trim().toLowerCase().replace(/\s+/g, "_");
  return COLUMN_ALIASES[key] || key;
}

function normalizeRows(rawRows) {
  return rawRows.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeColumnName(key)] = value;
    }
    return normalized;
  });
}

/** Parses a File (.csv or .xlsx/.xls) into an array of plain row objects with normalized column names. */
export async function parseUploadFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
    return normalizeRows(data);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
  return normalizeRows(data);
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Validates parsed upload rows. Returns an array of
 * { fullName, email, phone, age, department, role, status, valid, errors }.
 * `checkDuplicateInDb` is an async function (email) => boolean.
 */
export async function validateUploadRows(rows, checkDuplicateInDb) {
  if (rows.length === 0) {
    throw new Error("The file has no rows.");
  }
  const hasRequiredColumns = ["full_name", "email"].every((col) =>
    Object.prototype.hasOwnProperty.call(rows[0], col)
  );
  if (!hasRequiredColumns) {
    throw new Error("Missing required column(s): full_name, email");
  }

  const seenEmails = new Set();
  const result = [];

  for (const row of rows) {
    const errors = [];
    const fullName = clean(row.full_name);
    const email = clean(row.email).toLowerCase();
    const phone = clean(row.phone);
    const ageRaw = clean(row.age);
    const age = ageRaw && !Number.isNaN(Number(ageRaw)) ? parseInt(ageRaw, 10) : 0;

    let department = clean(row.department);
    if (!DEPARTMENTS.includes(department)) department = DEPARTMENTS[0];

    let role = clean(row.role);
    if (!ROLES.includes(role)) role = ROLES[0];

    let status = clean(row.status);
    if (!STATUSES.includes(status)) status = "Active";

    if (!fullName) errors.push("Missing full name");
    if (!email) {
      errors.push("Missing email");
    } else if (!EMAIL_RE.test(email)) {
      errors.push("Invalid email format");
    } else if (seenEmails.has(email)) {
      errors.push("Duplicate email in file");
    } else if (checkDuplicateInDb && (await checkDuplicateInDb(email))) {
      errors.push("Email already exists in database");
    }
    if (phone && !PHONE_RE.test(phone)) errors.push("Invalid phone format");

    if (email) seenEmails.add(email);

    result.push({
      fullName,
      email,
      phone,
      age,
      department,
      role,
      status,
      valid: errors.length === 0,
      errors: errors.join("; "),
    });
  }

  return result;
}

export function usersToCsvBlob(users) {
  const csv = Papa.unparse(users);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

export function usersToXlsxBlob(users) {
  const worksheet = XLSX.utils.json_to_sheet(users);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function uploadTemplateBlob() {
  return usersToXlsxBlob([
    {
      full_name: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "9876543210",
      age: 28,
      department: DEPARTMENTS[0],
      role: ROLES[0],
      status: "Active",
    },
  ]);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
