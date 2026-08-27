import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingScreen } from "./OnboardingScreen";

describe("OnboardingScreen", () => {
  it("renders the heading, body copy, media label, and actions", () => {
    render(
      <OnboardingScreen
        image="/onboarding/photo-goals.svg"
        imageAlt="A prepared meal"
        eyebrow="Goal setup"
        heading="Eat smart, anywhere."
        actions={<button type="button">Next</button>}
      >
        Body copy here.
      </OnboardingScreen>,
    );

    expect(
      screen.getByRole("heading", { name: "Eat smart, anywhere.", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Body copy here.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "A prepared meal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });
});
