"use client";

import { ScreenTodo } from "@/components/ScreenTodo";

// OUT OF SCOPE: no backend endpoint (MedicationFormScreen edit). Shows a "not available" panel.
export default function Page() {
  return <ScreenTodo route="/track/medication/edit/[id]" outOfScope />;
}
