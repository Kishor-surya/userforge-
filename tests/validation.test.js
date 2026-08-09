import { describe, expect, it } from "vitest";

import { EMAIL_RE, validateUserForm } from "../src/lib/validation.js";

describe("EMAIL_RE", () => {
  it("accepts a plausible email", () => {
    expect(EMAIL_RE.test("user@example.com")).toBe(true);
  });

  it("rejects a string with no @ or domain", () => {
    expect(EMAIL_RE.test("not-an-email")).toBe(false);
  });
});

describe("validateUserForm", () => {
  it("requires full name and email", async () => {
    const errors = await validateUserForm({ fullName: "", email: "", phone: "" });
    expect(errors).toContain("Full name is required.");
    expect(errors).toContain("Email is required.");
  });

  it("flags an invalid email format", async () => {
    const errors = await validateUserForm({ fullName: "Alice", email: "bad-email", phone: "" });
    expect(errors.some((e) => e.includes("invalid"))).toBe(true);
  });

  it("flags a duplicate email via the injected checkDuplicate callback", async () => {
    const errors = await validateUserForm({
      fullName: "Alice",
      email: "alice@example.com",
      phone: "",
      checkDuplicate: async () => true,
    });
    expect(errors.some((e) => e.includes("already exists"))).toBe(true);
  });

  it("flags an invalid phone format", async () => {
    const errors = await validateUserForm({ fullName: "Alice", email: "alice@example.com", phone: "abc" });
    expect(errors.some((e) => e.includes("Phone"))).toBe(true);
  });

  it("passes with valid input and no duplicate", async () => {
    const errors = await validateUserForm({
      fullName: "Alice",
      email: "alice@example.com",
      phone: "123-456-7890",
      checkDuplicate: async () => false,
    });
    expect(errors).toEqual([]);
  });
});
