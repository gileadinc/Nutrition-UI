"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { ToastViewport } from "@/components/Toast/ToastViewport";
import "./app.css";
import { AppShell } from "@/components/Shell";
import { useLocation, useNavigate } from "@/lib/nav";
import { useAppSession } from "@/lib/store";
import { ListPageSkeleton } from "@/components/Feedback";

/**
 * Signed-in OR guest shell with tab bar / side rail. Visitors with neither a
 * session nor a guest session are sent to /welcome (`/guest` creates its own
 * guest session, so it is exempt).
 */
function AppLayoutInner({
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
  const exempt = pathname === "/guest";
  const blocked = session.ready && session.status === "anonymous" && !exempt;

  useEffect(() => {
    if (blocked) navigate("/welcome", { replace: true });
  }, [blocked, navigate]);

  if (!session.ready || blocked) return <ListPageSkeleton />;
  return (
    <AppShell>
      {children}
      {modal}
      <ToastViewport />
    </AppShell>
  );
}

export default function AppLayout(props: { children: ReactNode; modal: ReactNode }) {
  // useSearchParams() in the shell and client screens needs a Suspense boundary above it.
  return (
    <Suspense fallback={null}>
      <AppLayoutInner {...props} />
    </Suspense>
  );
}
