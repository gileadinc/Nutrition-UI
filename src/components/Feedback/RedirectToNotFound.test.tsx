import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();
let pathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

import { RedirectToNotFound, isUnmatchedRoute } from "./RedirectToNotFound";

describe("RedirectToNotFound", () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
  });

  it("replaces an unknown URL with /404 (not push, so Back skips the bad URL)", () => {
    pathname = "/definitely-not-a-page";
    render(<RedirectToNotFound />);
    expect(replace).toHaveBeenCalledExactlyOnceWith("/404");
    expect(push).not.toHaveBeenCalled();
  });

  it("does nothing on /404 itself, so it can't loop", () => {
    pathname = "/404";
    render(<RedirectToNotFound />);
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("isUnmatchedRoute", () => {
  it("is true only for Next's __DEFAULT__ segment (no page matched)", () => {
    expect(isUnmatchedRoute(["__DEFAULT__"])).toBe(true);
    expect(isUnmatchedRoute(["home"])).toBe(false);
    expect(isUnmatchedRoute(["recipes", "abc"])).toBe(false);
    expect(isUnmatchedRoute(["recipes", "__DEFAULT__"])).toBe(false);
    expect(isUnmatchedRoute([])).toBe(false);
  });
});
