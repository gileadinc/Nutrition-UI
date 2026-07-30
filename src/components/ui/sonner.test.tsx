import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { toast } from "sonner";
import { Toaster } from "./sonner";

function TriggerButton({
  label,
  onTrigger,
}: {
  label: string;
  onTrigger: () => void;
}) {
  return (
    <button type="button" onClick={onTrigger}>
      {label}
    </button>
  );
}

describe("Toast system (sonner)", () => {
  it("shows a toast triggered imperatively via toast()", async () => {
    render(
      <>
        <TriggerButton label="Trigger" onTrigger={() => toast("Saved successfully")} />
        <Toaster />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Trigger" }));
    expect(await screen.findByText("Saved successfully")).toBeInTheDocument();
  });

  it("shows a success toast via toast.success()", async () => {
    render(
      <>
        <TriggerButton
          label="Trigger success"
          onTrigger={() => toast.success("Logged in successfully.")}
        />
        <Toaster />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Trigger success" }));
    expect(await screen.findByText("Logged in successfully.")).toBeInTheDocument();
  });

  it("shows an error toast via toast.error()", async () => {
    render(
      <>
        <TriggerButton label="Trigger error" onTrigger={() => toast.error("Something failed")} />
        <Toaster />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Trigger error" }));
    expect(await screen.findByText("Something failed")).toBeInTheDocument();
  });
});
