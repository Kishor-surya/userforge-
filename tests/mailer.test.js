import { describe, expect, it } from "vitest";

import { buildActivationEmail } from "../api/_mailer.js";

describe("buildActivationEmail", () => {
  it("includes the activation link, temp password, and department/role", () => {
    const msg = buildActivationEmail(
      {
        email: "bob@example.com",
        fullName: "Bob",
        department: "Sales",
        role: "Employee",
        activationLink: "https://example.com/activate/abc123",
        tempPassword: "Xy9!kLmQ2rTz",
      },
      "sender@example.com"
    );

    expect(msg.to).toBe("bob@example.com");
    expect(msg.from).toBe("sender@example.com");
    expect(msg.text).toContain("https://example.com/activate/abc123");
    expect(msg.html).toContain("https://example.com/activate/abc123");
    expect(msg.text).toContain("Xy9!kLmQ2rTz");
    expect(msg.html).toContain("Xy9!kLmQ2rTz");
    expect(msg.text).toContain("Sales");
  });
});
