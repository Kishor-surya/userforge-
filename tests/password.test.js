import { describe, expect, it } from "vitest";

import { generateRandomPassword } from "../api/_password.js";

describe("generateRandomPassword", () => {
  it("defaults to a 14-character password", () => {
    expect(generateRandomPassword()).toHaveLength(14);
  });

  it("respects a custom length", () => {
    expect(generateRandomPassword(20)).toHaveLength(20);
  });

  it("only uses the allowed character set", () => {
    const password = generateRandomPassword(200);
    expect(password).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%]+$/);
  });

  it("is not deterministic across calls", () => {
    const a = generateRandomPassword();
    const b = generateRandomPassword();
    expect(a).not.toBe(b);
  });
});
