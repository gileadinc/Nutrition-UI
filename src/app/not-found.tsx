import { CenteredShell, StatePanel } from "@/components/Feedback";
import { RedirectToNotFound } from "@/components/Feedback/RedirectToNotFound";

export default function NotFound() {
  return (
    <CenteredShell>
      <RedirectToNotFound />
      <StatePanel
        icon="search"
        title="That page doesn't exist"
        body="The link may be out of date, or the address may have a typo. Everything else is still where you left it."
        primary={{ label: "Go to Home", to: "/home" }}
        secondary={{ label: "Browse Fast Hacks", to: "/fast-hacks" }}
      />
    </CenteredShell>
  );
}
