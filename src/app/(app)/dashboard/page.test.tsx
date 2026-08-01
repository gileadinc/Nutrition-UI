import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardPage from "./page";

describe("Dashboard page", () => {
  it("renders the heading and default tab content", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Dashboard (placeholder)" })).toBeInTheDocument();
    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });
});
