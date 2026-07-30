import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./getErrorMessage";
import { ApiError } from "./ApiError";

describe("getErrorMessage", () => {
  it("returns the message from an ApiError", () => {
    const error = new ApiError("Email is already registered", { kind: "api", status: 409 });
    expect(getErrorMessage(error)).toBe("Email is already registered");
  });

  it("returns the message from a generic Error", () => {
    expect(getErrorMessage(new Error("Boom"))).toBe("Boom");
  });

  it("returns the string itself when given a string", () => {
    expect(getErrorMessage("Plain string error")).toBe("Plain string error");
  });

  it("falls back to a generic message for unknown values", () => {
    expect(getErrorMessage({ weird: true })).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});
