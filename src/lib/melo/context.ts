"use client";

import { useEffect, useRef } from "react";
import { useDayBudget } from "@/lib/store";
import { useTrackDays } from "@/lib/track";
import { useMeloCatalog } from "./catalog";
import type { MeloContext } from "./engine";

/** Live Melo context (real budget, last 7 tracked days, catalogue); `get()` reads the latest at send time. */
export function useMeloContext() {
  const { budget } = useDayBudget();
  const { days } = useTrackDays(7);
  const catalog = useMeloCatalog();
  const ref = useRef<MeloContext>({ budget, days, catalog });
  useEffect(() => {
    ref.current = { budget, days, catalog };
  });
  return { budget, days, catalog, get: () => ref.current };
}
