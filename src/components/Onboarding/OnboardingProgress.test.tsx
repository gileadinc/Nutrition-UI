import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingProgress } from "./OnboardingProgress";

describe("OnboardingProgress", () => {
  it("exposes progressbar semantics for the current step", () => {
    render(<OnboardingProgress current={2} total={3} />);

    const bar = screen.getByRole("progressbar", { name: "Step 2 of 3" });
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "3");
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });
});
