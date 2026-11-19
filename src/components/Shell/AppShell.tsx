"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { Link, NavLink, useLocation, useNavigate } from "@/lib/nav";
import { useIsDesktop } from "@/lib/hooks";
import { firstNameOf, useActivity, useAppSession, useProfile } from "@/lib/store";
import { dayCalories, dayProtein, dayWaterOz, useTrackDays } from "@/lib/track";
import { Logo } from "./Logo";
import { GuestGateProvider } from "./GuestGate";
import { NotificationBell } from "@/components/Notifications";
import { PILL } from "@/components/styles";
import { MeloLayer } from "@/components/Melo";
import { LogSheetHost, useLogSheet, type LogTab } from "@/components/Track/LogSheet";

export const MAIN_TABS: { label: string; icon: IconName; path: string }[] = [
  { label: "Home", icon: "tabHome", path: "/home" },
  { label: "HackThis!", icon: "bolt", path: "/fast-hacks" },
  { label: "CookThis!", icon: "tabRecipes", path: "/recipes" },
  { label: "TrackThis!", icon: "activity", path: "/track" },
  { label: "My Profile", icon: "tabYou", path: "/you" },
];

const QUICK_LOG: { label: string; icon: IconName; tab: LogTab }[] = [
  { label: "Meal", icon: "forkSpoon", tab: "meal" },
  { label: "Macros", icon: "chartBar", tab: "macros" },
  { label: "Activity", icon: "walking", tab: "activity" },
  { label: "Weight", icon: "weightScale", tab: "weight" },
  { label: "Water", icon: "droplet", tab: "water" },
  { label: "Medication", icon: "medication", tab: "medication" },
];

const ACTIVE = "var(--color-accent)";
const IDLE = "var(--color-text-secondary)";

/** Routes that show their own full-bleed header and hide the tab bar spacing. */
const IMMERSIVE = /^\/recipes\/[^/]+\/(ingredients|cook)$|^\/you\/personal-details$/;
const showsBottomPad = (pathname: string) => !IMMERSIVE.test(pathname);
/** Full-page questions that hide the top bar (and the assistant button). */
const BARE = /^\/you\/(goal|activity-level)$/;

function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:type-button focus:text-white"
    >
      Skip to content
    </a>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const session = useAppSession();
  const { profile } = useProfile();
  const name = firstNameOf(profile);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      navigate("/search");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
  return (
    <header className="sticky top-0 z-30 border-b border-border-divider bg-brand-cream/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          onClick={() => navigate("/search")}
          className={cn(
            PILL,
            "tap-44 relative flex h-10 min-w-0 flex-1 items-center gap-2.5 px-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:max-w-xl",
          )}
        >
          <span className="shrink-0">
            <Icon name="search" size={16} color="var(--color-text-secondary)" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] type-meta text-text-neutral-400">
            Search food, recipes and hacks
          </span>
          {desktop && (
            <kbd
              aria-hidden
              className="hidden shrink-0 rounded-md border border-border-default bg-brand-warm-gray px-1.5 py-0.5 text-[12px] leading-4 type-meta text-text-secondary md:inline-block"
            >
              /
            </kbd>
          )}
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NotificationBell />
          <Link
            to="/you"
            className="tap-44 relative flex items-center gap-2 rounded-full border border-border-default bg-white py-1.5 pl-1.5 pr-3"
            aria-label={name ? `Account: ${name}` : "Account"}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-[13px] type-button text-primary">
              {name ? (
                name.charAt(0).toUpperCase()
              ) : (
                <Icon name="userCircle" size={16} color="var(--color-primary)" />
              )}
            </span>
            {desktop && (
              <span className="max-w-[8rem] truncate text-[13px] type-button-secondary text-text-primary">
                {name ?? (session.isGuest ? "Guest" : "Account")}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

const RAIL_KEY = "forkthis_rail";

const railListeners = new Set<() => void>();
const readRail = (): "collapsed" | "expanded" | null => {
  try {
    const v = localStorage.getItem(RAIL_KEY);
    return v === "collapsed" || v === "expanded" ? v : null;
  } catch {
    return null;
  }
};
const subscribeRail = (cb: () => void) => {
  railListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    railListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

function useRailCollapsed(): [boolean, () => void] {
  const wide = useIsDesktop();
  const stored = useSyncExternalStore(subscribeRail, readRail, () => null);
  const collapsed = stored ? stored === "collapsed" : !wide;
  const toggle = () => {
    try {
      localStorage.setItem(RAIL_KEY, collapsed ? "expanded" : "collapsed");
    } catch {
      /* storage unavailable: the toggle just won't persist */
    }
    railListeners.forEach((l) => l());
  };
  return [collapsed, toggle];
}

const NUMBER_ICON: Record<string, IconName> = {
  calories: "fire",
  protein: "track",
  water: "droplet",
  activity: "activity",
};

/** Live "Today's numbers" readout shown in the rail on the track pages. */
function TodayNumbers() {
  const session = useAppSession();
  const { days } = useTrackDays(1);
  const activity = useActivity();
  const day = days[days.length - 1];
  const rows = [
    {
      id: "calories",
      label: "Calories",
      unit: "kcal",
      value: day ? Math.round(dayCalories(day)) : null,
    },
    { id: "protein", label: "Protein", unit: "g", value: day ? Math.round(dayProtein(day)) : null },
    { id: "water", label: "Water", unit: "oz", value: day ? Math.round(dayWaterOz(day)) : null },
    { id: "activity", label: "Active", unit: "min", value: activity.todayMinutes },
  ];
  return (
    <section
      aria-label="Today's log metrics"
      className="mt-auto border-t border-border-divider px-2 pt-4"
    >
      <div className="flex items-center justify-between gap-1">
        <h2 className="text-xs type-section-title uppercase tracking-[.08em] text-text-secondary">
          Today’s numbers
        </h2>
        <span className="flex size-10 items-center justify-center rounded-full text-brand-navy">
          <Icon name="filterSliders" size={16} color="currentColor" />
        </span>
      </div>
      {session.isGuest ? (
        <p className="mt-2 px-2 text-xs text-text-secondary">Sign in to see your daily numbers.</p>
      ) : (
        <dl className="mt-1 space-y-1">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-navy-soft motion-safe:transition-transform motion-safe:hover:translate-x-1"
            >
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy-soft text-brand-navy"
              >
                <Icon name={NUMBER_ICON[r.id]} size={16} color="currentColor" />
              </span>
              <dt className="min-w-0 flex-1 truncate text-xs text-text-secondary">{r.label}</dt>
              <dd className="shrink-0 text-sm type-section-title tabular-nums text-brand-navy">
                {r.value === null ? "—" : r.value.toLocaleString("en-US")}{" "}
                <span className="text-[11px] type-body">{r.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function RailTab({ tab, collapsed }: { tab: (typeof MAIN_TABS)[number]; collapsed: boolean }) {
  return (
    <NavLink
      to={tab.path}
      aria-label={collapsed ? tab.label : undefined}
      title={collapsed ? tab.label : undefined}
      className={({ isActive }) =>
        cn(
          "tap-44 relative flex items-center rounded-full text-sm transition-colors",
          collapsed ? "size-11 justify-center" : "gap-3 px-3 py-2.5",
          isActive
            ? "type-button text-accent-ink"
            : "type-button-secondary text-text-secondary hover:bg-brand-warm-gray",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={tab.icon} size={20} color={isActive ? ACTIVE : IDLE} />
          {!collapsed && tab.label}
        </>
      )}
    </NavLink>
  );
}

function SideRail({ pathname }: { pathname: string }) {
  const inTrack = pathname.startsWith("/track");
  const [collapsed, toggle] = useRailCollapsed();
  const logs = useLogSheet();
  return (
    <nav
      aria-label="Main"
      data-variant="rail"
      data-collapsed={collapsed}
      className={cn(
        "panel sticky top-0 flex h-dvh shrink-0 flex-col overflow-y-auto overflow-x-hidden rounded-none border-y-0 border-l-0 shadow-none transition-[width] duration-200 motion-reduce:transition-none",
        collapsed ? "w-[76px] items-center p-2.5" : "w-52 p-3 lg:w-64 lg:p-4",
      )}
    >
      <div
        className={cn(
          "mb-4 flex shrink-0 items-center",
          collapsed ? "flex-col gap-3" : "justify-between gap-2",
        )}
      >
        <Link
          to="/home"
          className="tap-44 relative flex shrink-0 items-center px-1"
          aria-label="ForkThis home"
        >
          <Logo size="md" decorative mark={collapsed} />
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="tap-44 relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary transition-colors hover:border-text-neutral-400 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={16} color="currentColor" />
        </button>
      </div>
      <div className={cn("flex flex-col gap-1", collapsed && "items-center")}>
        {MAIN_TABS.map((tab) => (
          <RailTab key={tab.path} tab={tab} collapsed={collapsed} />
        ))}
      </div>
      <div className={inTrack ? "hidden" : cn("mt-auto", !collapsed && "hidden lg:block")}>
        {!collapsed && <p className="eyebrow px-3 pb-2">Quick log</p>}
        <div
          className={
            collapsed ? "flex flex-col items-center gap-1.5 pt-3" : "grid grid-cols-2 gap-2"
          }
        >
          {QUICK_LOG.map((q) =>
            collapsed ? (
              <button
                key={q.label}
                type="button"
                onClick={() => logs.open(q.tab)}
                aria-label={q.label}
                title={`Log ${q.label.toLowerCase()}`}
                className="tap-44 relative flex size-11 items-center justify-center rounded-full bg-brand-warm-gray transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <Icon name={q.icon} size={18} color="var(--color-primary)" />
              </button>
            ) : (
              <button
                key={q.label}
                type="button"
                onClick={() => logs.open(q.tab)}
                className="flex min-h-20 flex-col justify-between rounded-xl bg-brand-warm-gray p-3 text-left text-xs type-button-secondary text-text-primary transition-colors hover:bg-primary-soft"
              >
                <Icon name={q.icon} size={18} color="var(--color-primary)" />
                {q.label}
              </button>
            ),
          )}
        </div>
      </div>
      {inTrack && !collapsed && <TodayNumbers />}
    </nav>
  );
}

function TabBar() {
  return (
    <nav
      aria-label="Main"
      data-variant="tabbar"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border-divider bg-white"
    >
      <ul className="flex h-[60px] items-stretch p-1">
        {MAIN_TABS.map((tab) => (
          <li key={tab.path} className="flex-1">
            <NavLink
              to={tab.path}
              title={tab.label}
              className="relative flex size-full flex-col items-center justify-center rounded-xl"
            >
              {({ isActive }) => (
                <>
                  <span
                    className="transition-transform duration-200 ease-out motion-reduce:transform-none"
                    style={{ transform: isActive ? "translateY(-2px) scale(1.1)" : "none" }}
                  >
                    <Icon name={tab.icon} size={20} color={isActive ? ACTIVE : IDLE} />
                  </span>
                  <span
                    className={cn(
                      "mt-[3px] text-[12px] leading-none",
                      isActive
                        ? "type-button text-accent-ink"
                        : "type-button-secondary text-text-secondary",
                    )}
                    style={{ letterSpacing: "-0.495px" }}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Authenticated-or-guest app frame: desktop = side rail + top bar; mobile = bottom tab bar.
 * Also provides the guest account gate and moves focus to <main> on navigation.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const desktop = useIsDesktop();
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
  }, [pathname]);
  const pad = showsBottomPad(pathname);
  return (
    <GuestGateProvider>
      <div id="app-root" className="min-h-dvh bg-brand-cream">
        <SkipLink />
        <div className={cn(desktop && "flex")}>
          {desktop && <SideRail pathname={pathname} />}
          <div className="min-w-0 flex-1">
            {desktop && !BARE.test(pathname) && <TopBar />}
            <main
              id="main"
              ref={main}
              tabIndex={-1}
              className={cn(
                "min-w-0 focus:outline-none",
                pad ? "pb-[76px] md:pb-6" : !desktop && "pb-[60px]",
              )}
            >
              {children}
            </main>
          </div>
        </div>
        {!desktop && <TabBar />}
        <MeloLayer />
        <LogSheetHost />
      </div>
    </GuestGateProvider>
  );
}
