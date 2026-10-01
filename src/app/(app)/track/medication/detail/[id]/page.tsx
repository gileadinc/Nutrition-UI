"use client";

import { ScreenTodo } from "@/components/ScreenTodo";

// OUT OF SCOPE: no backend endpoint (MedicationDetailScreen). Shows a "not available" panel.
export default function Page() {
  return <ScreenTodo route="/track/medication/detail/[id]" outOfScope />;
}
