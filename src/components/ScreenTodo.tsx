"use client";

import { CenteredShell, StatePanel } from "@/components/Feedback";

/**
 * Placeholder body for routes whose screen has not been ported yet
 * (`source` = deployed chunk to port from), or that are intentionally not
 * built because the backend has no endpoint (`outOfScope`).
 */
export function ScreenTodo({
  route,
  source,
  outOfScope = false,
}: {
  route: string;
  source?: string;
  outOfScope?: boolean;
}) {
  return (
    <CenteredShell>
      <StatePanel
        icon={outOfScope ? "info" : "task"}
        title={outOfScope ? "Not available yet" : "TODO"}
        body={
          outOfScope
            ? "This feature isn't available in this version of ForkThis."
            : `Screen not ported yet: ${route}`
        }
        primary={{ label: "Go to Home", to: "/home" }}
        detail={source}
      />
    </CenteredShell>
  );
}
