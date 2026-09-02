"use client";

import Link from "next/link";
import { Compass, NotebookPen, Sparkles } from "lucide-react";
import type { HomeGuidance as HomeGuidanceData } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./HomeGuidance.module.css";

/** Guidance nudges from `discovery/home.guidance`. */
export function HomeGuidance({ guidance }: { guidance: HomeGuidanceData }) {
  const items: { key: string; icon: typeof Compass; text: string; href: string; cta: string }[] = [];

  if (guidance.showOnboardingGuidance) {
    items.push({
      key: "onboarding",
      icon: Compass,
      text: "Finish setting up your goals and body context for tailored targets.",
      href: ROUTES.onboarding.goals,
      cta: "Continue setup",
    });
  }
  if (guidance.showTrackingGuidance) {
    items.push({
      key: "tracking",
      icon: NotebookPen,
      text: "Log your first meal to start seeing your daily progress.",
      href: ROUTES.track,
      cta: "Log a meal",
    });
  }
  if (guidance.showQuickTour) {
    items.push({
      key: "tour",
      icon: Sparkles,
      text: "New here? Take a quick look around the app.",
      href: ROUTES.guestHome,
      cta: "Explore",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className={styles.list}>
      {items.map(({ key, icon: Icon, text, href, cta }) => (
        <div key={key} className={styles.card}>
          <Icon className={styles.icon} aria-hidden="true" />
          <p className={styles.text}>{text}</p>
          <Link href={href} className={styles.cta}>
            {cta}
          </Link>
        </div>
      ))}
    </div>
  );
}
