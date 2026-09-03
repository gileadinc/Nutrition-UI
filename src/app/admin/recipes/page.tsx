"use client";

import { AdminListView, type Column } from "../_components/AdminListView";
import { adminApi, type AdminRecipe } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

const columns: Column<AdminRecipe>[] = [
  { key: "title", header: "Title", primary: true, render: (r) => r.title },
  { key: "category", header: "Category", render: (r) => r.category ?? "—" },
  { key: "calories", header: "Calories", render: (r) => `${r.calories ?? "—"}` },
  { key: "protein", header: "Protein", render: (r) => `${r.protein ?? "—"}g` },
  {
    key: "tags",
    header: "Goal tags",
    render: (r) => (r.goalTags?.length ? r.goalTags.join(", ") : "—"),
  },
];

export default function AdminRecipesPage() {
  return (
    <AdminListView<AdminRecipe>
      title="Recipes"
      subtitle="Cook-at-home catalog."
      newHref={ROUTES.admin.recipeNew}
      newLabel="New recipe"
      rowHref={(r) => ROUTES.admin.recipe(r.id)}
      columns={columns}
      fetchPage={(p) => adminApi.recipes.list(p)}
      searchPlaceholder="Search recipes…"
      emptyLabel="No recipes yet."
    />
  );
}
