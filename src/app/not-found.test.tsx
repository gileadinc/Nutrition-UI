import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("NotFound page", () => {
  it("renders a message and a link back home", () => {
    render(<NotFound />);
    expect(screen.getByRole("alert")).toHaveTextContent("Page not found");
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });
});
