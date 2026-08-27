import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField } from "./PasswordField";

describe("PasswordField", () => {
  it("renders a masked password input by default", () => {
    render(<PasswordField label="Password" />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("toggles visibility when the show/hide control is clicked", async () => {
    render(<PasswordField label="Password" />);
    const input = screen.getByLabelText("Password");

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("shows an error message and marks the input invalid", () => {
    render(<PasswordField label="Password" error="Too short" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Too short");
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
  });
});
