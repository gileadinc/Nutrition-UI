"use client";

import { use } from "react";
import { MenuItemForm } from "../MenuItemForm";

export default function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <MenuItemForm id={id} />;
}
