import { describe, expect, it } from "vitest";

import {
  isAllowedAttachmentType,
  isValidProvisioningCategory,
  MAX_ATTACHMENT_BYTES,
  sanitizeFilename,
} from "../api/_attachments.js";

describe("isValidProvisioningCategory", () => {
  it("accepts every documented category", () => {
    for (const key of ["stationary", "access", "transportation", "medical", "food", "accommodation", "gift_card"]) {
      expect(isValidProvisioningCategory(key)).toBe(true);
    }
  });

  it("rejects an unknown category", () => {
    expect(isValidProvisioningCategory("yacht")).toBe(false);
  });
});

describe("isAllowedAttachmentType", () => {
  it("accepts image, pdf, word, excel, and text mime types", () => {
    for (const type of [
      "image/png",
      "image/jpeg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ]) {
      expect(isAllowedAttachmentType(type)).toBe(true);
    }
  });

  it("rejects an executable or unknown mime type", () => {
    expect(isAllowedAttachmentType("application/x-msdownload")).toBe(false);
    expect(isAllowedAttachmentType(undefined)).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("strips characters outside the safe set", () => {
    expect(sanitizeFilename("my report (final)!.pdf")).toBe("my_report__final__.pdf");
  });

  it("falls back to a default name when empty", () => {
    expect(sanitizeFilename("")).toBe("attachment");
    expect(sanitizeFilename(undefined)).toBe("attachment");
  });
});

describe("MAX_ATTACHMENT_BYTES", () => {
  it("is 5MB", () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(5 * 1024 * 1024);
  });
});
