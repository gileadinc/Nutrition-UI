"use client";

import { AdminListView, type Column } from "../_components/AdminListView";
import { adminApi, type AdminMenuItem } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

const columns: Column<AdminMenuItem>[] = [
  { key: "name", header: "Name", primary: true, render: (m) => m.name },
  { key: "restaurant", header: "Restaurant", render: (m) => m.restaurantName ?? "—" },
  { key: "calories", header: "Calories", render: (m) => `${m.calories ?? "—"}` },
  { key: "protein", header: "Protein", render: (m) => `${m.protein ?? "—"}g` },
];

export default function AdminMenuItemsPage() {
  return (
    <AdminListView<AdminMenuItem>
      title="Menu items"
      subtitle="Restaurant dishes with ordering guidance."
      newHref={ROUTES.admin.menuItemNew}
      newLabel="New menu item"
      rowHref={(m) => ROUTES.admin.menuItem(m.id)}
      columns={columns}
      fetchPage={(p) => adminApi.menuItems.list(p)}
      searchPlaceholder="Search menu items…"
      emptyLabel="No menu items yet."
    />
  );
}
