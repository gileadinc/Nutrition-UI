"use client";

/**
 * Thin react-router compatibility layer over next/navigation so screens ported
 * from the deployed Vite app keep their shape:
 *
 *   useNavigate()      -> navigate("/x", { replace }) | navigate(-1)
 *   useLocation()      -> { pathname, search }
 *   useSearchParams()  -> [URLSearchParams, setSearchParams(next, { replace })]
 *   useSearchParam(k)  -> string | null
 *   <Link to>          -> next/link with a `to` prop
 *   <NavLink to>       -> Link whose className/children may be functions of { isActive }
 *   <Navigate to>      -> redirect on mount
 *   useParams()        -> re-export
 *
 * NOTE: `useSearchParams` requires a <Suspense> boundary above the page; the
 * (public) and (app) layouts provide one.
 */

import NextLink from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, type AnchorHTMLAttributes, type ReactNode } from "react";

export interface NavigateOptions {
  replace?: boolean;
  /** Accepted for react-router parity; Next has no location state, so it is ignored. */
  state?: unknown;
}

export type NavigateFn = {
  (to: string, options?: NavigateOptions): void;
  (delta: number): void;
};

export function useNavigate(): NavigateFn {
  const router = useRouter();
  const fn = useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        if (to === -1) router.back();
        else if (to === 1) router.forward();
        else window.history.go(to);
        return;
      }
      if (options?.replace) router.replace(to);
      else router.push(to);
    },
    [router],
  );
  return fn as NavigateFn;
}

/**
 * Go back if the user arrived from inside the app, otherwise fall back to
 * `fallback` (default `/home`). Matches the deployed BackButton behavior.
 */
export function useBack(fallback = "/home") {
  const router = useRouter();
  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}

export function useLocation() {
  const pathname = usePathname();
  const params = useNextSearchParams();
  const search = params.toString();
  return useMemo(() => ({ pathname, search: search ? `?${search}` : "" }), [pathname, search]);
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>, options?: NavigateOptions) => void,
] {
  const params = useNextSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const set = useCallback(
    (next: URLSearchParams | Record<string, string>, options?: NavigateOptions) => {
      const qs = new URLSearchParams(next as Record<string, string>).toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (options?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router],
  );
  const copy = useMemo(() => new URLSearchParams(params.toString()), [params]);
  return [copy, set];
}

/** Read a single query param. */
export function useSearchParam(key: string): string | null {
  return useNextSearchParams().get(key);
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useNextParams() as unknown as T;
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  /** Accepted for react-router parity; ignored. */
  state?: unknown;
}

export function Link({ to, state: _state, ...rest }: LinkProps) {
  void _state;
  return <NextLink href={to} {...rest} />;
}

export interface NavLinkProps extends Omit<LinkProps, "className" | "children"> {
  className?: string | ((s: { isActive: boolean }) => string);
  children?: ReactNode | ((s: { isActive: boolean }) => ReactNode);
  /** Match only the exact path (default: prefix match on segment boundary). */
  end?: boolean;
}

export function NavLink({ to, className, children, end, ...rest }: NavLinkProps) {
  const pathname = usePathname();
  const target = to.split("?")[0];
  const isActive = end
    ? pathname === target
    : pathname === target || pathname.startsWith(`${target}/`);
  return (
    <Link
      to={to}
      aria-current={isActive ? "page" : undefined}
      className={typeof className === "function" ? className({ isActive }) : className}
      {...rest}
    >
      {typeof children === "function" ? children({ isActive }) : children}
    </Link>
  );
}

/** Redirects on mount (client side). */
export function Navigate({ to, replace = true }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace]);
  return null;
}
