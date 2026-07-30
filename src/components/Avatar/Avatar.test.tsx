import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders initials from a full name", () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByRole("img", { name: "Jane Doe" })).toHaveTextContent("JD");
  });

  it("renders a single initial for a one-word name", () => {
    render(<Avatar name="Cher" />);
    expect(screen.getByRole("img", { name: "Cher" })).toHaveTextContent("C");
  });

  it("renders an image when src is provided", () => {
    render(<Avatar name="Jane Doe" src="/avatar.png" />);
    expect(screen.getByRole("img", { name: "Jane Doe" }).querySelector("img")).toHaveAttribute(
      "src",
      "/avatar.png",
    );
  });
});
