"use client";

import { CustomRecipeEditorScreen } from "@/screens/catalog/CustomRecipeEditorScreen";

/**
 * Soft navigation to /recipes/new. Without this file the sibling `(.)recipes/[id]` route
 * intercepts it and treats "new" as a recipe id, so the editor reports "That recipe isn't here".
 */
export default function Page() {
  return <CustomRecipeEditorScreen />;
}
