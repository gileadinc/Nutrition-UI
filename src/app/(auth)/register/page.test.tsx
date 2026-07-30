import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RegisterPage from "./page";

describe("Register page", () => {
  it("renders name, email, password, and terms fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "I agree to the placeholder terms" }),
    ).toBeInTheDocument();
  });
});
