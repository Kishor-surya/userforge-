import { describe, expect, it } from "vitest";

import { statusBadgeClass } from "../src/lib/statusBadge.js";

describe("statusBadgeClass", () => {
  it("maps approved/rejected/pending to their badge classes", () => {
    expect(statusBadgeClass("approved")).toBe("valid");
    expect(statusBadgeClass("rejected")).toBe("invalid");
    expect(statusBadgeClass("pending")).toBe("pending");
  });

  it("defaults unknown statuses to pending", () => {
    expect(statusBadgeClass("something-else")).toBe("pending");
  });
});
