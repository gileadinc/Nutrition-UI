"use client";

import { ScreenTodo } from "@/components/ScreenTodo";

// OUT OF SCOPE: no backend endpoint (AssistantContextScreen). Shows a "not available" panel.
export default function Page() {
  return <ScreenTodo route="/assistant/context/[type]" outOfScope />;
}
