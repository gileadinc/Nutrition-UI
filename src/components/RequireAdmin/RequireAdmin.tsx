"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { getSession, isAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

/**
 * Client-side gate for the /admin section: requires a session AND membership in
 * the Cognito `admin` group. Non-admins are bounced to the app dashboard;
 * signed-out users to /login. The backend enforces this regardless (403).
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session.accessToken) {
      const next = encodeURIComponent(window.location.pathname);
      router.replace(`${ROUTES.login}?next=${next}`);
      return;
    }
    if (!isAdmin()) {
      router.replace(ROUTES.dashboard);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reveals children once the client-side admin check passes
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
