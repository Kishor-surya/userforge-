// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SetPassword from "../../src/components/SetPassword.jsx";
import { setPasswordAfterInvite } from "../../src/lib/auth.js";

vi.mock("../../src/lib/auth.js", () => ({
  setPasswordAfterInvite: vi.fn(),
}));

describe("SetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a password shorter than 8 characters without calling the API", async () => {
    const user = userEvent.setup();
    render(<SetPassword onDone={vi.fn()} />);

    await user.type(screen.getByLabelText(/new password/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(setPasswordAfterInvite).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without calling the API", async () => {
    const user = userEvent.setup();
    render(<SetPassword onDone={vi.fn()} />);

    await user.type(screen.getByLabelText(/new password/i), "longenough1");
    await user.type(screen.getByLabelText(/confirm password/i), "differentpass");
    await user.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(setPasswordAfterInvite).not.toHaveBeenCalled();
  });

  it("sets the password and calls onDone when valid and matching", async () => {
    setPasswordAfterInvite.mockResolvedValue();
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<SetPassword onDone={onDone} />);

    await user.type(screen.getByLabelText(/new password/i), "longenough1");
    await user.type(screen.getByLabelText(/confirm password/i), "longenough1");
    await user.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(setPasswordAfterInvite).toHaveBeenCalledWith("longenough1");
  });

  it("shows an error and does not call onDone if the API call fails", async () => {
    setPasswordAfterInvite.mockRejectedValue(new Error("Link expired"));
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<SetPassword onDone={onDone} />);

    await user.type(screen.getByLabelText(/new password/i), "longenough1");
    await user.type(screen.getByLabelText(/confirm password/i), "longenough1");
    await user.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText("Link expired")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
