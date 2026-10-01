"use client";

import { ScreenTodo } from "@/components/ScreenTodo";

// OUT OF SCOPE: no backend endpoint (TrackEntryHistoryScreen kind=activity). Shows a "not available" panel.
export default function Page() {
  return <ScreenTodo route="/track/activity/history" outOfScope />;
}
