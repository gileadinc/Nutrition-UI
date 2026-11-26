import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Page not found · ForkThis",
  robots: { index: false, follow: false },
};

/**
 * The 404 page at a stable URL. Unknown routes are redirected here (see `[...catchAll]`), and
 * `notFound()` renders `app/not-found.tsx` with an HTTP 404 status.
 */
export default function NotFoundPage() {
  notFound();
}
