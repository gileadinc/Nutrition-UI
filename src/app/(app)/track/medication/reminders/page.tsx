"use client";

import { ScreenTodo } from "@/components/ScreenTodo";

// OUT OF SCOPE: no backend endpoint (MedicationRemindersScreen). Shows a "not available" panel.
export default function Page() {
  return <ScreenTodo route="/track/medication/reminders" outOfScope />;
}
