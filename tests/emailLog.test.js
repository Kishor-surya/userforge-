import { describe, expect, it, vi } from "vitest";

import { logEmail } from "../api/_emailLog.js";

function makeSupabaseStub(insertImpl) {
  return { from: () => ({ insert: insertImpl }) };
}

describe("logEmail", () => {
  it("inserts a row with the given fields", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabaseAdmin = makeSupabaseStub(insert);

    await logEmail(supabaseAdmin, { recipient: "a@example.com", emailType: "activation", sent: true, error: null });

    expect(insert).toHaveBeenCalledWith({
      recipient: "a@example.com",
      email_type: "activation",
      sent: true,
      error: null,
    });
  });

  it("normalizes a missing error to null", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabaseAdmin = makeSupabaseStub(insert);

    await logEmail(supabaseAdmin, { recipient: "a@example.com", emailType: "activation", sent: false });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ error: null }));
  });

  it("never throws, even if the insert itself throws", async () => {
    const insert = vi.fn().mockRejectedValue(new Error("db down"));
    const supabaseAdmin = makeSupabaseStub(insert);

    await expect(
      logEmail(supabaseAdmin, { recipient: "a@example.com", emailType: "activation", sent: false, error: "x" })
    ).resolves.toBeUndefined();
  });
});
