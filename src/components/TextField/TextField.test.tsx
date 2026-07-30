import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("associates the label with the input", () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("accepts typed input", async () => {
    render(<TextField label="Email" />);
    const input = screen.getByLabelText("Email");
    await userEvent.type(input, "hello@example.com");
    expect(input).toHaveValue("hello@example.com");
  });

  it("shows an error message when provided", () => {
    render(<TextField label="Email" error="Email is required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });
});
