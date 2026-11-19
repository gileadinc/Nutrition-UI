"use client";

import { useParams } from "@/lib/nav";
import { DetailDrawer } from "@/components/Shell";
import { CustomRecipeEditorScreen } from "@/screens/catalog/CustomRecipeEditorScreen";
import { RecipeDetailScreen } from "@/screens/catalog/RecipeDetailScreen";

/** Soft navigation to /recipes/:id opens the recipe over the current page (`/recipes/new` is the editor). */
export default function Page() {
  const { id } = useParams<{ id: string }>();
  if (id === "new") return <CustomRecipeEditorScreen />;
  return (
    <DetailDrawer fallbackPath="/recipes">
      <RecipeDetailScreen />
    </DetailDrawer>
  );
}
