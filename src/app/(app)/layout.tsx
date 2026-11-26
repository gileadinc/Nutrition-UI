"use client";

import { useEffect, type ReactNode } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { AppShell } from "@/components/Shell";
import { useLocation, useNavigate } from "@/lib/nav";
import { useAppSession } from "@/lib/store";
import { ListPageSkeleton } from "@/components/Feedback";
import { isUnmatchedRoute } from "@/components/Feedback/RedirectToNotFound";

/**
 * Signed-in OR guest shell with tab bar / side rail. Visitors with neither a
 * session nor a guest session are sent to /welcome (`/guest` creates its own
 * guest session, so it is exempt).
 */
export default function AppLayout({
  children,
  modal,
}: {
  children: ReactNode;
  /** Parallel `@modal` slot: recipe / hack details opened over the current page. */
  modal: ReactNode;
}) {
  const session = useAppSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Unknown URLs bypass the sign-in gate so they reach the 404 page, not /welcome.
  const unmatched = isUnmatchedRoute(useSelectedLayoutSegments());
  const exempt = pathname === "/guest" || unmatched;
  const blocked = session.ready && session.status === "anonymous" && !exempt;

  useEffect(() => {
    if (blocked) navigate("/welcome", { replace: true });
  }, [blocked, navigate]);

  if (unmatched) return <>{children}</>;
  if (!session.ready || blocked) return <ListPageSkeleton />;
  return (
    <AppShell>
      {children}
      {modal}
    </AppShell>
  );
}
