"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { getSession } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

/**
 * Client-side gate: redirects to /login (with a `next` param) when there is no
 * access token. Placeholder-grade — a real build would verify server-side.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session.accessToken) {
      const next = encodeURIComponent(window.location.pathname);
      router.replace(`${ROUTES.login}?next=${next}`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reveals children once the client-side token check passes
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
