// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BulkUpload from "../../src/components/BulkUpload.jsx";
import { adminBulkCreateUsers } from "../../src/lib/adminApi.js";
import { parseUploadFile, validateUploadRows } from "../../src/lib/csvExcel.js";

vi.mock("../../src/lib/adminApi.js", () => ({
  adminBulkCreateUsers: vi.fn(),
}));
vi.mock("../../src/lib/csvExcel.js", () => ({
  parseUploadFile: vi.fn(),
  validateUploadRows: vi.fn(),
  uploadTemplateBlob: vi.fn(() => new Blob()),
  downloadBlob: vi.fn(),
}));

const sampleFile = new File(["full_name,email\nAlice,alice@example.com"], "users.csv", { type: "text/csv" });

const validRow = {
  fullName: "Alice",
  email: "alice@example.com",
  phone: "",
  age: 0,
  department: "Engineering",
  role: "Employee",
  status: "Active",
  valid: true,
  errors: "",
};

describe("BulkUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses a file and shows the validation preview", async () => {
    parseUploadFile.mockResolvedValue([{ full_name: "Alice", email: "alice@example.com" }]);
    validateUploadRows.mockResolvedValue([validRow]);
    const user = userEvent.setup();

    render(<BulkUpload onUsersImported={vi.fn()} />);
    await user.upload(screen.getByLabelText(/choose a csv or excel file/i), sampleFile);

    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText(/1 row\(s\) found/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import 1 valid user/i })).toBeInTheDocument();
  });

  it("shows a parse error when the file can't be read", async () => {
    parseUploadFile.mockRejectedValue(new Error("Missing required column(s): email"));
    const user = userEvent.setup();

    render(<BulkUpload onUsersImported={vi.fn()} />);
    await user.upload(screen.getByLabelText(/choose a csv or excel file/i), sampleFile);

    expect(await screen.findByText("Missing required column(s): email")).toBeInTheDocument();
  });

  it("imports valid rows and reports the result", async () => {
    parseUploadFile.mockResolvedValue([{ full_name: "Alice", email: "alice@example.com" }]);
    validateUploadRows.mockResolvedValue([validRow]);
    adminBulkCreateUsers.mockResolvedValue({
      created: 1,
      emailsSent: 1,
      results: [{ ok: true, email: "alice@example.com" }],
    });
    const onUsersImported = vi.fn();
    const user = userEvent.setup();

    render(<BulkUpload onUsersImported={onUsersImported} />);
    await user.upload(screen.getByLabelText(/choose a csv or excel file/i), sampleFile);
    await user.click(await screen.findByRole("button", { name: /import 1 valid user/i }));

    await waitFor(() => expect(onUsersImported).toHaveBeenCalled());
    expect(await screen.findByText(/imported 1 of 1 valid row/i)).toBeInTheDocument();
  });

  it("shows a no-valid-rows warning and no import button when every row is invalid", async () => {
    parseUploadFile.mockResolvedValue([{ email: "not-an-email" }]);
    validateUploadRows.mockResolvedValue([
      { ...validRow, fullName: "", email: "not-an-email", valid: false, errors: "Missing full name" },
    ]);
    const user = userEvent.setup();

    render(<BulkUpload onUsersImported={vi.fn()} />);
    await user.upload(screen.getByLabelText(/choose a csv or excel file/i), sampleFile);

    expect(await screen.findByText(/no valid rows to import/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^import/i })).not.toBeInTheDocument();
  });
});
