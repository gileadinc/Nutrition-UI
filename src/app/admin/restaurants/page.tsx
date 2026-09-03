"use client";

import { AdminListView, type Column } from "../_components/AdminListView";
import { adminApi, type AdminRestaurant } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

const columns: Column<AdminRestaurant>[] = [
  { key: "name", header: "Name", primary: true, render: (r) => r.name },
  {
    key: "location",
    header: "Location",
    render: (r) => [r.city, r.state].filter(Boolean).join(", ") || "—",
  },
  { key: "category", header: "Category", render: (r) => r.category ?? "—" },
  {
    key: "tested",
    header: "Tested orders",
    render: (r) => `${r.testedOrderCount ?? 0}`,
  },
];

export default function AdminRestaurantsPage() {
  return (
    <AdminListView<AdminRestaurant>
      title="Restaurants"
      subtitle="Eat-out venues and their menus."
      newHref={ROUTES.admin.restaurantNew}
      newLabel="New restaurant"
      rowHref={(r) => ROUTES.admin.restaurant(r.id)}
      columns={columns}
      fetchPage={(p) => adminApi.restaurants.list(p)}
      searchPlaceholder="Search restaurants…"
      emptyLabel="No restaurants yet."
    />
  );
}
