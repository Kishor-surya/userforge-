// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddUser from "../../src/components/AddUser.jsx";
import { adminCreateUser } from "../../src/lib/adminApi.js";

vi.mock("../../src/lib/adminApi.js", () => ({
  adminCreateUser: vi.fn(),
}));

describe("AddUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors and never calls the API when required fields are missing", async () => {
    const user = userEvent.setup();
    render(<AddUser onUserAdded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^add user$/i }));

    expect(await screen.findByText("Full name is required.")).toBeInTheDocument();
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(adminCreateUser).not.toHaveBeenCalled();
  });

  it("submits a valid form, shows the email-sent confirmation, and resets", async () => {
    adminCreateUser.mockResolvedValue({ emailSent: true });
    const onUserAdded = vi.fn();
    const user = userEvent.setup();
    render(<AddUser onUserAdded={onUserAdded} />);

    await user.type(screen.getByLabelText(/full name/i), "Alice Smith");
    await user.type(screen.getByLabelText(/^email/i), "alice@example.com");
    await user.click(screen.getByRole("button", { name: /^add user$/i }));

    await waitFor(() => expect(adminCreateUser).toHaveBeenCalled());
    expect(adminCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Alice Smith", email: "alice@example.com" })
    );
    expect(await screen.findByText(/added successfully/i)).toBeInTheDocument();
    expect(await screen.findByText(/invite email sent/i)).toBeInTheDocument();
    expect(onUserAdded).toHaveBeenCalled();
  });

  it("still reports success but flags the email failure when the API says the email failed", async () => {
    adminCreateUser.mockResolvedValue({ emailSent: false, emailError: "SMTP timeout" });
    const user = userEvent.setup();
    render(<AddUser onUserAdded={vi.fn()} />);

    await user.type(screen.getByLabelText(/full name/i), "Bob Jones");
    await user.type(screen.getByLabelText(/^email/i), "bob@example.com");
    await user.click(screen.getByRole("button", { name: /^add user$/i }));

    expect(await screen.findByText(/invite email not sent: SMTP timeout/i)).toBeInTheDocument();
  });

  it("shows a top-level error if the API call itself fails", async () => {
    adminCreateUser.mockRejectedValue(new Error("A user with email bob@example.com already exists."));
    const user = userEvent.setup();
    render(<AddUser onUserAdded={vi.fn()} />);

    await user.type(screen.getByLabelText(/full name/i), "Bob Jones");
    await user.type(screen.getByLabelText(/^email/i), "bob@example.com");
    await user.click(screen.getByRole("button", { name: /^add user$/i }));

    expect(await screen.findByText("A user with email bob@example.com already exists.")).toBeInTheDocument();
  });
});
