"use client";

import { useEffect } from "react";
import { useLocation, useNavigate } from "@/lib/nav";

export const NOT_FOUND_PATH = "/404";

/**
 * True when the `(app)` layout's `children` slot matched no page. Next reports that as the
 * `__DEFAULT__` segment (real pages report their own, e.g. `["recipes", "abc"]`), which lets the
 * layout skip its sign-in gate and show the 404 instead of sending a visitor to /welcome.
 */
export const isUnmatchedRoute = (segments: string[]) =>
  segments.length === 1 && segments[0] === "__DEFAULT__";

/**
 * Rendered inside the not-found page. Any URL that reaches it (an unknown route) is replaced with
 * `/404`, so the address bar shows the 404 page and Back doesn't return to the bad URL. On `/404`
 * itself it does nothing, which is what stops it looping.
 */
export function RedirectToNotFound() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (pathname !== NOT_FOUND_PATH) navigate(NOT_FOUND_PATH, { replace: true });
  }, [pathname, navigate]);
  return null;
}
