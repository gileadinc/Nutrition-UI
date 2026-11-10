import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RegisterPage from "./page";

describe("Register page", () => {
  it("renders name, email, password, and terms fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });
});
