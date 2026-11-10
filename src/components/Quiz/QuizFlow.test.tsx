import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { QuizFlow } from "./QuizFlow";

describe("QuizFlow", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
        clear: () => store.clear(),
      },
    });
  });

  it("starts on the intro screen and moves into the first question", async () => {
    render(<QuizFlow />);
    expect(screen.getByRole("heading", { name: "Start Your ForkThis! Quiz" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start Here" }));
    expect(screen.getByRole("heading", { name: "How old are you?" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("rejects impossible months and moves to the next field when one is complete", async () => {
    render(<QuizFlow />);
    await userEvent.click(screen.getByRole("button", { name: "Start Here" }));
    const month = screen.getByLabelText("Month");

    await userEvent.type(month, "22");
    expect(month).toHaveValue("02"); // "2" -> 02, the second "2" is on the day field
    expect(screen.getByLabelText("Day")).toHaveFocus();
    expect(screen.getByLabelText("Day")).toHaveValue("2");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("requires a valid adult date of birth before continuing", async () => {
    render(<QuizFlow />);
    await userEvent.click(screen.getByRole("button", { name: "Start Here" }));
    const cont = screen.getByRole("button", { name: "Continue" });
    expect(cont).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Month"), "03");
    await userEvent.type(screen.getByLabelText("Day"), "15");
    await userEvent.type(screen.getByLabelText("Year"), "1993");
    expect(cont).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent(/years old/);
  });

  it("walks through every step to a plan", async () => {
    render(<QuizFlow />);
    await userEvent.click(screen.getByRole("button", { name: "Start Here" }));
    await userEvent.type(screen.getByLabelText("Month"), "03");
    await userEvent.type(screen.getByLabelText("Day"), "15");
    await userEvent.type(screen.getByLabelText("Year"), "1993");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await userEvent.click(screen.getByRole("button", { name: /Lose weight/ }));
    for (let i = 0; i < 2; i++) {
      await userEvent.click(screen.getByRole("button", { name: "Continue" })); // goal -> height -> weight
    }
    await userEvent.click(screen.getByRole("button", { name: "Continue" })); // weight -> activity
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: /Moderately active/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    // health is the last step
    expect(screen.getByRole("heading", { name: /Anything else/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: /No surgery/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: /analyzing/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /analyzing/ }));
    expect(screen.getByText("Plan ready")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save your plan" }));
    expect(screen.getByRole("heading", { name: "Save your plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue with email" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: "Continue without an account" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
