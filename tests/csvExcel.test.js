import { describe, expect, it, vi } from "vitest";

import {
  parseUploadFile,
  uploadTemplateBlob,
  usersToCsvBlob,
  usersToXlsxBlob,
  validateUploadRows,
} from "../src/lib/csvExcel.js";

function csvFile(content, name = "users.csv") {
  return new File([content], name, { type: "text/csv" });
}

describe("parseUploadFile", () => {
  it("parses a CSV file and normalizes column names", async () => {
    const rows = await parseUploadFile(csvFile("Full Name,Email\nAlice,alice@example.com\n"));
    expect(rows).toEqual([{ full_name: "Alice", email: "alice@example.com" }]);
  });

  it("applies known column aliases", async () => {
    const rows = await parseUploadFile(csvFile("Name,Email Address\nBob,bob@example.com\n"));
    expect(rows[0]).toMatchObject({ full_name: "Bob", email: "bob@example.com" });
  });
});

describe("validateUploadRows", () => {
  it("throws when required columns are missing", async () => {
    await expect(validateUploadRows([{ full_name: "Alice" }], vi.fn())).rejects.toThrow(/email/);
  });

  it("marks a fully valid row as valid with no errors", async () => {
    const [row] = await validateUploadRows(
      [{ full_name: "Alice", email: "alice@example.com", phone: "1234567890" }],
      async () => false
    );
    expect(row.valid).toBe(true);
    expect(row.errors).toBe("");
  });

  it("flags a duplicate email already in the database", async () => {
    const [row] = await validateUploadRows(
      [{ full_name: "Alice", email: "alice@example.com" }],
      async () => true
    );
    expect(row.valid).toBe(false);
    expect(row.errors).toContain("already exists");
  });

  it("flags a duplicate email within the same file", async () => {
    const rows = await validateUploadRows(
      [
        { full_name: "Alice", email: "dup@example.com" },
        { full_name: "Alice Two", email: "dup@example.com" },
      ],
      async () => false
    );
    expect(rows[0].valid).toBe(true);
    expect(rows[1].valid).toBe(false);
    expect(rows[1].errors).toContain("Duplicate email in file");
  });

  it("defaults an unrecognized department to the first known department", async () => {
    const [row] = await validateUploadRows(
      [{ full_name: "Alice", email: "alice@example.com", department: "Nope" }],
      async () => false
    );
    expect(row.department).not.toBe("Nope");
  });
});

describe("export helpers", () => {
  it("usersToCsvBlob produces a CSV blob", () => {
    const blob = usersToCsvBlob([{ full_name: "Alice", email: "alice@example.com" }]);
    expect(blob.type).toContain("text/csv");
  });

  it("usersToXlsxBlob produces a valid xlsx (zip) blob", () => {
    const blob = usersToXlsxBlob([{ full_name: "Alice", email: "alice@example.com" }]);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("uploadTemplateBlob produces a non-empty xlsx blob", () => {
    const blob = uploadTemplateBlob();
    expect(blob.size).toBeGreaterThan(0);
  });
});
