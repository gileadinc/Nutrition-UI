import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("renders the title as an alert", () => {
    render(<ErrorState title="Something went wrong" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("renders an optional description and action", () => {
    render(
      <ErrorState
        title="Failed to load"
        description="Please try again."
        action={<button>Retry</button>}
      />,
    );
    expect(screen.getByText("Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
