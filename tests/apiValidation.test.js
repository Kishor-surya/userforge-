import { describe, expect, it } from "vitest";

import { normalizeCreatePayload } from "../api/_validation.js";

describe("normalizeCreatePayload", () => {
  it("normalizes a valid payload", () => {
    const { data, errors } = normalizeCreatePayload({
      fullName: " Alice ",
      email: " Alice@Example.com ",
      phone: "123",
      age: "30",
      department: "Engineering",
      role: "Manager",
      status: "Active",
    });
    expect(errors).toEqual([]);
    expect(data.fullName).toBe("Alice");
    expect(data.email).toBe("alice@example.com");
    expect(data.age).toBe(30);
  });

  it("falls back unknown department/role/status to defaults", () => {
    const { data } = normalizeCreatePayload({
      fullName: "Alice",
      email: "alice@example.com",
      department: "Nope",
      role: "Nope",
      status: "Nope",
    });
    expect(data.department).toBe("Engineering");
    expect(data.role).toBe("Admin");
    expect(data.status).toBe("Active");
  });

  it("reports errors for missing/invalid fields", () => {
    const { errors } = normalizeCreatePayload({ fullName: "", email: "bad" });
    expect(errors.length).toBeGreaterThan(0);
  });
});
