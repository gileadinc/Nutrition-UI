import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Select } from "./Select";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];

describe("Select", () => {
  it("associates the label with the select", () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByLabelText("Choose")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByRole("option", { name: "Option A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option B" })).toBeInTheDocument();
  });

  it("changes value on selection", async () => {
    render(<Select label="Choose" options={options} />);
    const select = screen.getByLabelText("Choose") as HTMLSelectElement;
    await userEvent.selectOptions(select, "b");
    expect(select.value).toBe("b");
  });
});
