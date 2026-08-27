import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RegisterPage from "./page";
import { Toaster } from "@/components/ui/sonner";
import { authApi } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    authApi: {
      register: vi.fn(),
    },
  };
});

function renderRegisterPage() {
  return render(
    <>
      <RegisterPage />
      <Toaster />
    </>,
  );
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText("Full name"), "Jane Doe");
  await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
  await userEvent.type(screen.getByLabelText("New password"), "supersecret");
  await userEvent.type(screen.getByLabelText("Confirm password"), "supersecret");
  await userEvent.click(screen.getByRole("checkbox"));
}

describe("Register page", () => {
  it("renders the heading, all fields, and the terms checkbox", () => {
    renderRegisterPage();
    expect(
      screen.getByRole("heading", { name: "Create your account", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });

  it("shows validation errors and does not call the API when the form is empty", async () => {
    renderRegisterPage();
    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Choose a password.")).toBeInTheDocument();
    expect(screen.getByText("Please accept the terms to continue.")).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("flags a mismatched confirmation password", async () => {
    renderRegisterPage();
    await userEvent.type(screen.getByLabelText("Full name"), "Jane Doe");
    await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
    await userEvent.type(screen.getByLabelText("New password"), "supersecret");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("submits a valid form and shows a success toast", async () => {
    vi.mocked(authApi.register).mockResolvedValue({ userId: "1", email: "jane@example.com" });
    renderRegisterPage();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "supersecret",
      }),
    );
    expect(
      await screen.findByText("Account created. Let's set up your goals."),
    ).toBeInTheDocument();
  });

  it("links back to sign in", () => {
    renderRegisterPage();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});
