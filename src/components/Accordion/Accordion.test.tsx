import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion } from "./Accordion";

const items = [
  { value: "one", question: "Question one?", answer: "Answer one." },
  { value: "two", question: "Question two?", answer: "Answer two." },
];

describe("Accordion", () => {
  it("renders all questions with panels collapsed by default", () => {
    render(<Accordion items={items} />);
    expect(screen.getByRole("button", { name: /Question one\?/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Answer one.")).not.toBeInTheDocument();
  });

  it("expands a panel when its trigger is clicked", async () => {
    render(<Accordion items={items} />);
    await userEvent.click(screen.getByRole("button", { name: /Question one\?/ }));

    expect(screen.getByText("Answer one.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Question one\?/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("collapses an open panel when its trigger is clicked again", async () => {
    render(<Accordion items={items} defaultOpenValue="one" />);
    expect(screen.getByText("Answer one.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Question one\?/ }));
    expect(screen.queryByText("Answer one.")).not.toBeInTheDocument();
  });

  it("only shows one open panel at a time", async () => {
    render(<Accordion items={items} defaultOpenValue="one" />);
    await userEvent.click(screen.getByRole("button", { name: /Question two\?/ }));

    expect(screen.queryByText("Answer one.")).not.toBeInTheDocument();
    expect(screen.getByText("Answer two.")).toBeInTheDocument();
  });
});
