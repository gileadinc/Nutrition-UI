"use client";

import { ScreenTodo } from "@/components/ScreenTodo";

// OUT OF SCOPE: no backend endpoint (AssistantSearchScreen). Shows a "not available" panel.
export default function Page() {
  return <ScreenTodo route="/assistant/search" outOfScope />;
}
