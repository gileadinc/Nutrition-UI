import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs } from "./Tabs";

const items = [
  { value: "one", label: "One", content: <p>Content one</p> },
  { value: "two", label: "Two", content: <p>Content two</p> },
];

describe("Tabs", () => {
  it("renders the first tab's content by default", () => {
    render(<Tabs items={items} />);
    expect(screen.getByText("Content one")).toBeInTheDocument();
  });

  it("switches panels when a tab is clicked", async () => {
    render(<Tabs items={items} />);
    await userEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByText("Content two")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
  });
});
