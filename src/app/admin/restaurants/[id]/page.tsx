"use client";

import { use } from "react";
import { RestaurantForm } from "../RestaurantForm";

export default function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RestaurantForm id={id} />;
}
