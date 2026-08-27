import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SocialAuthButtons } from "./SocialAuthButtons";

describe("SocialAuthButtons", () => {
  it("renders Apple and Google buttons with the given divider label", () => {
    render(<SocialAuthButtons dividerLabel="Or use email" />);
    expect(screen.getByText("Or use email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apple" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google" })).toBeInTheDocument();
  });
});
