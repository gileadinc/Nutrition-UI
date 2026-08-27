import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WelcomePage from "./welcome/page";
import GoalsPage from "./goals/page";
import BasicsPage from "./basics/page";
import HealthPage from "./health/page";

describe("Onboarding flow", () => {
  it("welcome screen offers Get Started and Continue as Guest", () => {
    render(<WelcomePage />);

    expect(
      screen.getByRole("heading", { name: "Your ForkThis! moment starts here.", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Started" })).toHaveAttribute(
      "href",
      "/onboarding/goals",
    );
    expect(screen.getByRole("link", { name: "Continue as Guest" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("goals screen is step 1 of 3 and links to basics", () => {
    render(<GoalsPage />);

    expect(screen.getByRole("progressbar", { name: "Step 1 of 3" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Eat smart, anywhere.", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/onboarding/basics",
    );
  });

  it("basics screen is step 2 of 3 and links to health", () => {
    render(<BasicsPage />);

    expect(screen.getByRole("progressbar", { name: "Step 2 of 3" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/onboarding/health",
    );
  });

  it("health screen is step 3 of 3 and finishes to register", () => {
    render(<HealthPage />);

    expect(screen.getByRole("progressbar", { name: "Step 3 of 3" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Clinical depth, real empathy.", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Let's Begin" })).toHaveAttribute("href", "/register");
  });
});
