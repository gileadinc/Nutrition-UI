import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormErrorMessage } from "./FormErrorMessage";

describe("FormErrorMessage", () => {
  it("renders the error text as an alert", () => {
    render(<FormErrorMessage>Something went wrong</FormErrorMessage>);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });
});
