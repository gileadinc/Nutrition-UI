import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./page";
import { ToastProvider, ToastViewport } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    authApi: {
      login: vi.fn(),
    },
  };
});

function renderLoginPage() {
  return render(
    <ToastProvider>
      <LoginPage />
      <ToastViewport />
    </ToastProvider>,
  );
}

describe("Login page", () => {
  it("renders email and password fields with a submit button", () => {
    renderLoginPage();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("submits credentials and shows a success toast on success", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ userId: "1", email: "jane@example.com" });
    renderLoginPage();

    await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "hunter2");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: "jane@example.com",
        password: "hunter2",
      }),
    );
    expect(await screen.findByText("Logged in successfully.")).toBeInTheDocument();
  });

  it("shows the error message inline when login fails", async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError("Invalid email or password", { kind: "api", status: 401 }),
    );
    renderLoginPage();

    await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });
});
