import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./ToastContext";
import { ToastViewport } from "./ToastViewport";

function TriggerToast({
  message,
  variant,
  durationMs,
}: {
  message: string;
  variant?: "success" | "error" | "info";
  durationMs?: number;
}) {
  const { showToast } = useToast();
  useEffect(() => {
    showToast(message, { variant, durationMs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

describe("Toast system", () => {
  it("renders a toast triggered via useToast", async () => {
    render(
      <ToastProvider>
        <TriggerToast message="Saved successfully" variant="success" durationMs={0} />
        <ToastViewport />
      </ToastProvider>,
    );

    expect(await screen.findByText("Saved successfully")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uses the alert role for error toasts", async () => {
    render(
      <ToastProvider>
        <TriggerToast message="Something failed" variant="error" durationMs={0} />
        <ToastViewport />
      </ToastProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Something failed");
  });

  it("dismisses a toast when its dismiss button is clicked", async () => {
    render(
      <ToastProvider>
        <TriggerToast message="Dismiss me" durationMs={0} />
        <ToastViewport />
      </ToastProvider>,
    );

    await screen.findByText("Dismiss me");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));

    await waitFor(() => expect(screen.queryByText("Dismiss me")).not.toBeInTheDocument());
  });

  it("throws when useToast is used outside a ToastProvider", () => {
    function Broken() {
      useToast();
      return null;
    }

    expect(() => render(<Broken />)).toThrow("useToast must be used within a ToastProvider");
  });
});
