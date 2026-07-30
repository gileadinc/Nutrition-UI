import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingIndicator } from "./LoadingIndicator";

describe("LoadingIndicator", () => {
  it("renders a status role with default label", () => {
    render(<LoadingIndicator />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("renders a custom label", () => {
    render(<LoadingIndicator label="Saving changes" />);
    expect(screen.getByRole("status")).toHaveTextContent("Saving changes");
  });
});
