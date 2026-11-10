import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import RegisterPage from "./page";

describe("Register page", () => {
  it("renders name, email, password, and terms fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Middle name or initials")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });

  it("opens Terms and Privacy in a modal without ticking the checkbox", async () => {
    render(<RegisterPage />);
    const checkbox = screen.getByRole("checkbox");

    await userEvent.click(screen.getByRole("button", { name: "Terms" }));
    expect(await screen.findByRole("dialog", { name: "Terms of service" })).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Terms of service" })).toBeInTheDocument();

    // The dialog has both an X and a footer Close button; either dismisses it.
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Privacy Policy" }));
    expect(await screen.findByRole("dialog", { name: "Privacy policy" })).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });
});
