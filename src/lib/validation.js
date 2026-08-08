export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_RE = /^[0-9+\-\s()]{6,20}$/;

/**
 * Validate a single-user form. `checkDuplicate` is an async function
 * (email) => boolean, injected so this stays testable without a live DB.
 */
export async function validateUserForm({ fullName, email, phone, checkDuplicate }) {
  const errors = [];

  if (!fullName || !fullName.trim()) {
    errors.push("Full name is required.");
  }

  const trimmedEmail = (email || "").trim();
  if (!trimmedEmail) {
    errors.push("Email is required.");
  } else if (!EMAIL_RE.test(trimmedEmail)) {
    errors.push("Email format is invalid.");
  } else if (checkDuplicate && (await checkDuplicate(trimmedEmail))) {
    errors.push("A user with this email already exists.");
  }

  if (phone && phone.trim() && !PHONE_RE.test(phone.trim())) {
    errors.push("Phone number format looks invalid.");
  }

  return errors;
}
