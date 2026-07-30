import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the placeholder heading and call to action", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: "Nutrition (placeholder product name)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Placeholder call to action" })).toBeInTheDocument();
  });
});
