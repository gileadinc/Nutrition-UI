import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title and optional description", () => {
    render(<EmptyState title="No results" description="Try adjusting your filters" />);
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
  });

  it("renders an optional action", () => {
    render(<EmptyState title="No results" action={<button>Reset filters</button>} />);
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
  });
});
