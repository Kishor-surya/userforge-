import { describe, expect, it } from "vitest";

import { buildInviteEmail, buildWelcomeEmail } from "../api/_mailer.js";

describe("buildWelcomeEmail", () => {
  it("addresses the recipient and includes department/role", () => {
    const msg = buildWelcomeEmail(
      { email: "alice@example.com", fullName: "Alice", department: "Engineering", role: "Manager" },
      "sender@example.com"
    );
    expect(msg.to).toBe("alice@example.com");
    expect(msg.from).toBe("sender@example.com");
    expect(msg.text).toContain("Engineering");
    expect(msg.text).toContain("Manager");
    expect(msg.html).toContain("Engineering");
  });
});

describe("buildInviteEmail", () => {
  it("includes the invite link and department/role, and never mentions a password", () => {
    const msg = buildInviteEmail(
      {
        email: "bob@example.com",
        fullName: "Bob",
        department: "Sales",
        role: "Employee",
        inviteLink: "https://example.com/invite/abc123",
      },
      "sender@example.com"
    );
    expect(msg.to).toBe("bob@example.com");
    expect(msg.text).toContain("https://example.com/invite/abc123");
    expect(msg.html).toContain("https://example.com/invite/abc123");
    expect(msg.text).toContain("Sales");
    expect(msg.text.toLowerCase()).not.toContain("your password is");
  });
});
