import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the hero heading and primary call to action", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: "Nutrition (placeholder product name)", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Placeholder call to action" })[0],
    ).toBeInTheDocument();
  });

  it("renders the stats bar", () => {
    render(<Home />);
    expect(screen.getByText("10k+")).toBeInTheDocument();
    expect(screen.getByText("Placeholder active users")).toBeInTheDocument();
  });

  it("renders all six feature cards", () => {
    render(<Home />);
    expect(screen.getByText("Placeholder feature one")).toBeInTheDocument();
    expect(screen.getByText("Placeholder feature six")).toBeInTheDocument();
  });

  it("renders the how-it-works steps", () => {
    render(<Home />);
    expect(screen.getByText("Placeholder step one")).toBeInTheDocument();
    expect(screen.getByText("Placeholder step three")).toBeInTheDocument();
  });

  it("renders testimonials with an avatar per author", () => {
    render(<Home />);
    expect(screen.getByText("Placeholder User One")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Placeholder User One" })).toBeInTheDocument();
  });

  it("renders an expandable FAQ accordion", async () => {
    render(<Home />);
    const trigger = screen.getByRole("button", { name: /Placeholder question one\?/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("Placeholder answer text explaining the first frequently asked question."),
    ).toBeInTheDocument();
  });

  it("renders the final call-to-action section with a link to register", () => {
    render(<Home />);
    expect(screen.getByText("Placeholder closing call to action")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
