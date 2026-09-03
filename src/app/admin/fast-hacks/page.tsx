"use client";

import { AdminListView, type Column } from "../_components/AdminListView";
import { adminApi, type AdminFastHack } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

const columns: Column<AdminFastHack>[] = [
  { key: "title", header: "Title", primary: true, render: (h) => h.title },
  { key: "outcome", header: "Outcome", render: (h) => h.outcome ?? "—" },
  {
    key: "tags",
    header: "Goal tags",
    render: (h) => (h.goalTags?.length ? h.goalTags.join(", ") : "—"),
  },
];

export default function AdminFastHacksPage() {
  return (
    <AdminListView<AdminFastHack>
      title="Fast Hacks"
      subtitle="Quick, low-effort wins."
      newHref={ROUTES.admin.fastHackNew}
      newLabel="New Fast Hack"
      rowHref={(h) => ROUTES.admin.fastHack(h.id)}
      columns={columns}
      fetchPage={(p) => adminApi.fastHacks.list(p)}
      searchPlaceholder="Search Fast Hacks…"
      emptyLabel="No Fast Hacks yet."
    />
  );
}
