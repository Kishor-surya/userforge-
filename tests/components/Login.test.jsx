// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Login from "../../src/components/Login.jsx";
import { adminLogin } from "../../src/lib/adminApi.js";
import { requestPasswordReset, signInWithPassword } from "../../src/lib/auth.js";

vi.mock("../../src/lib/adminApi.js", () => ({
  adminLogin: vi.fn(),
}));
vi.mock("../../src/lib/auth.js", () => ({
  signInWithPassword: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs a regular user in and calls onUserLoggedIn", async () => {
    signInWithPassword.mockResolvedValue({});
    const onUserLoggedIn = vi.fn();
    const user = userEvent.setup();

    render(<Login onAdminLoggedIn={vi.fn()} onUserLoggedIn={onUserLoggedIn} />);

    await user.type(screen.getByLabelText(/^email$/i), "alice@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "hunter22");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(onUserLoggedIn).toHaveBeenCalled());
    expect(signInWithPassword).toHaveBeenCalledWith("alice@example.com", "hunter22");
  });

  it("shows an error message when sign-in fails", async () => {
    signInWithPassword.mockRejectedValue(new Error("Invalid login credentials"));
    const user = userEvent.setup();

    render(<Login onAdminLoggedIn={vi.fn()} onUserLoggedIn={vi.fn()} />);

    await user.type(screen.getByLabelText(/^email$/i), "alice@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
  });

  it("switches to the admin tab and logs in as admin", async () => {
    adminLogin.mockResolvedValue("token123");
    const onAdminLoggedIn = vi.fn();
    const user = userEvent.setup();

    render(<Login onAdminLoggedIn={onAdminLoggedIn} onUserLoggedIn={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /show admin sign-in form/i }));
    await user.clear(screen.getByLabelText(/username/i));
    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/^password$/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: /admin sign in/i }));

    await waitFor(() => expect(onAdminLoggedIn).toHaveBeenCalled());
    expect(adminLogin).toHaveBeenCalledWith("admin", "correct-horse");
  });

  it("sends a password reset request via the forgot-password link", async () => {
    requestPasswordReset.mockResolvedValue();
    const user = userEvent.setup();

    render(<Login onAdminLoggedIn={vi.fn()} onUserLoggedIn={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /forgot password/i }));
    await user.type(screen.getByLabelText(/email to reset/i), "bob@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith("bob@example.com"));
    expect(await screen.findByText(/password reset link has been sent/i)).toBeInTheDocument();
  });
});
