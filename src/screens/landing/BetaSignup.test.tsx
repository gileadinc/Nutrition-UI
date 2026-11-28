import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BetaSignupButton } from "./BetaSignup";
import { BetaSignupError } from "@/lib/beta/submit";

const submit = vi.fn();
vi.mock("@/lib/beta/submit", async (orig) => ({
  ...(await orig<typeof import("@/lib/beta/submit")>()),
  submitBetaSignup: (...args: unknown[]) => submit(...args),
}));

afterEach(() => submit.mockReset());

async function openAndFill() {
  const user = userEvent.setup();
  render(<BetaSignupButton>Sign up as beta tester</BetaSignupButton>);
  await user.click(screen.getByRole("button", { name: /sign up as beta tester/i }));
  await user.type(screen.getByLabelText(/first name/i), "Ada");
  await user.type(screen.getByLabelText(/last name/i), "Lovelace");
  await user.type(screen.getByLabelText(/^email/i), "ada@x.com");
  return user;
}

describe("BetaSignupButton", () => {
  it("submits the details and shows a confirmation", async () => {
    submit.mockResolvedValue(undefined);
    const user = await openAndFill();
    await user.click(screen.getByRole("button", { name: /join the beta/i }));
    expect(await screen.findByText(/you’re on the list/i)).toBeInTheDocument();
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "Ada", lastName: "Lovelace", email: "ada@x.com" }),
    );
  });

  it("shows the error and keeps the form when sending fails", async () => {
    submit.mockRejectedValue(new BetaSignupError("Try again later."));
    const user = await openAndFill();
    await user.click(screen.getByRole("button", { name: /join the beta/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Try again later."));
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Ada");
  });
});
