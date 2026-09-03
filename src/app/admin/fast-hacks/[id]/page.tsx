"use client";

import { use } from "react";
import { FastHackForm } from "../FastHackForm";

export default function EditFastHackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <FastHackForm id={id} />;
}
