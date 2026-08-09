import { randomBytes } from "node:crypto";

// Avoids visually ambiguous characters (0/O, 1/l/I) while still mixing
// upper/lower/digit/symbol.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

/** Generates a random temporary password. Never logged, only ever passed in-memory to the email builder. */
export function generateRandomPassword(length = 14) {
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += CHARS[bytes[i] % CHARS.length];
  }
  return password;
}
