"use client";

import { DetailDrawer } from "@/components/Shell";
import { RecipeDetailScreen } from "@/screens/catalog/RecipeDetailScreen";

/** Soft navigation to /recipes/:id opens the recipe over the current page. */
export default function Page() {
  return (
    <DetailDrawer fallbackPath="/recipes">
      <RecipeDetailScreen />
    </DetailDrawer>
  );
}
