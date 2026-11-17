import type { ReactNode } from "react";

/** Bare pages: splash, welcome, onboarding, questionnaire and auth flows (no tab bar). */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div id="app-root">{children}</div>;
}
