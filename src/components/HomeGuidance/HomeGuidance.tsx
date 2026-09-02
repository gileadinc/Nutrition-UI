"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Compass,
  NotebookPen,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import type { HomeGuidance as HomeGuidanceData } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./HomeGuidance.module.css";

const STORAGE_KEY = "forkthis.home.guidanceCollapsed";

export interface HomeGuidanceProps {
  guidance: HomeGuidanceData;
  /**
   * Whether onboarding is actually complete. The backend's
   * `showOnboardingGuidance` flag isn't recomputed after guest data is
   * migrated, so the dashboard passes `Boolean(feed.goal)` here to suppress the
   * "finish setup" nudge for users who are already done.
   */
  onboardingComplete?: boolean;
}

interface Step {
  key: string;
  icon: typeof Compass;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

const collapseListeners = new Set<() => void>();

function subscribeCollapsed(cb: () => void) {
  collapseListeners.add(cb);
  return () => {
    collapseListeners.delete(cb);
  };
}

function getCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore
  }
  collapseListeners.forEach((fn) => fn());
}

/** Onboarding checklist derived from `discovery/home.guidance`. */
export function HomeGuidance({ guidance, onboardingComplete = false }: HomeGuidanceProps) {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsed,
    () => false,
  );

  function toggle() {
    setCollapsed(!collapsed);
  }

  const steps: Step[] = [
    {
      key: "onboarding",
      icon: Compass,
      title: "Finish your setup",
      description: "Set your goal and body context so targets are tailored to you.",
      href: ROUTES.onboarding.goals,
      cta: "Continue setup",
      done: onboardingComplete || !guidance.showOnboardingGuidance,
    },
    {
      key: "tracking",
      icon: NotebookPen,
      title: "Log your first meal",
      description: "Start tracking to see your daily progress fill in.",
      href: ROUTES.track,
      cta: "Log a meal",
      done: !guidance.showTrackingGuidance,
    },
    {
      key: "tour",
      icon: Sparkles,
      title: "Look around",
      description: "Browse recipes and eat-out picks matched to your goal.",
      href: ROUTES.guestHome,
      cta: "Explore",
      done: !guidance.showQuickTour,
    },
  ];

  const pending = steps.filter((s) => !s.done);
  if (pending.length === 0) return null;

  const completed = steps.length - pending.length;

  return (
    <section className={styles.card} aria-label="Getting started">
      <button
        type="button"
        className={styles.header}
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls="home-guidance-body"
      >
        <span className={styles.headerText}>
          <span className={styles.title}>Get started</span>
          <span className={styles.subtitle}>
            {completed} of {steps.length} done
          </span>
        </span>
        <span className={styles.headerRight}>
          <span className={styles.progress} aria-hidden="true">
            {steps.map((s) => (
              <span key={s.key} className={s.done ? styles.dotDone : styles.dot} />
            ))}
          </span>
          {collapsed ? (
            <ChevronRight className={styles.chevron} aria-hidden="true" />
          ) : (
            <ChevronDown className={styles.chevron} aria-hidden="true" />
          )}
        </span>
      </button>

      {!collapsed ? (
        <div id="home-guidance-body">
          <ul className={styles.steps}>
            {pending.map(({ key, icon: Icon, title, description, href, cta }) => (
              <li key={key}>
                <Link href={href} className={styles.step}>
                  <span className={styles.stepIcon}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className={styles.stepBody}>
                    <span className={styles.stepTitle}>{title}</span>
                    <span className={styles.stepDescription}>{description}</span>
                  </span>
                  <span className={styles.stepCta}>
                    {cta}
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {completed > 0 ? (
            <ul className={styles.doneList}>
              {steps
                .filter((s) => s.done)
                .map(({ key, title }) => (
                  <li key={key} className={styles.doneRow}>
                    <Check className="size-3.5" aria-hidden="true" />
                    {title}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
