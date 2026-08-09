export const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Support"];
export const ROLES = ["Admin", "Manager", "Employee", "Contractor", "Intern"];
export const STATUSES = ["Active", "Inactive"];
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Normalizes a raw create-user payload (from the browser, bulk upload, or a
 * GitHub issue) into a clean shape, falling back to sane defaults for
 * unrecognized department/role/status values. Returns { data, errors }.
 */
export function normalizeCreatePayload(body) {
  const errors = [];

  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();

  const ageRaw = String(body.age ?? "").trim();
  const age = ageRaw && !Number.isNaN(Number(ageRaw)) ? parseInt(ageRaw, 10) : 0;

  let department = String(body.department || "").trim();
  if (!DEPARTMENTS.includes(department)) department = DEPARTMENTS[0];

  let role = String(body.role || "").trim();
  if (!ROLES.includes(role)) role = ROLES[0];

  let status = String(body.status || "").trim();
  if (!STATUSES.includes(status)) status = "Active";

  if (!fullName) errors.push("fullName is required.");
  if (!email) {
    errors.push("email is required.");
  } else if (!EMAIL_RE.test(email)) {
    errors.push("email format is invalid.");
  }

  return {
    data: { fullName, email, phone, age, department, role, status },
    errors,
  };
}
