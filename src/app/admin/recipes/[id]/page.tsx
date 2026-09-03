"use client";

import { use } from "react";
import { RecipeForm } from "../RecipeForm";

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RecipeForm id={id} />;
}
