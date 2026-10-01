"use client";

import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/Shell";
import { useLocation, useNavigate } from "@/lib/nav";
import { useAppSession } from "@/lib/store";
import { ListPageSkeleton } from "@/components/Feedback";

/**
 * Signed-in OR guest shell with tab bar / side rail. Visitors with neither a
 * session nor a guest session are sent to /welcome (`/guest` creates its own
 * guest session, so it is exempt).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const session = useAppSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const exempt = pathname === "/guest";
  const blocked = session.ready && session.status === "anonymous" && !exempt;

  useEffect(() => {
    if (blocked) navigate("/welcome", { replace: true });
  }, [blocked, navigate]);

  if (!session.ready || blocked) return <ListPageSkeleton />;
  return <AppShell>{children}</AppShell>;
}
