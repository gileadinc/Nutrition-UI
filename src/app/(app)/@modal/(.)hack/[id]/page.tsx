"use client";

import { DetailDrawer } from "@/components/Shell";
import { HackDetailScreen } from "@/screens/catalog/HackDetailScreen";

/** Soft navigation to /hack/:id opens the hack over the current page. */
export default function Page() {
  return (
    <DetailDrawer fallbackPath="/fast-hacks">
      <HackDetailScreen />
    </DetailDrawer>
  );
}
