"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { Link, NavLink, useLocation, useNavigate } from "@/lib/nav";
import { useIsDesktop } from "@/lib/hooks";
import { firstNameOf, useAppSession, useNotifications, useProfile } from "@/lib/store";
import { Logo } from "./Logo";
import { GuestGateProvider } from "./GuestGate";
import { PILL } from "@/components/styles";

export const MAIN_TABS: { label: string; icon: IconName; path: string }[] = [
  { label: "Home", icon: "tabHome", path: "/home" },
  { label: "Fast Hacks", icon: "bolt", path: "/fast-hacks" },
  { label: "Recipes", icon: "tabRecipes", path: "/recipes" },
  { label: "Track", icon: "activity", path: "/track" },
  { label: "You", icon: "tabYou", path: "/you" },
];

const QUICK_LOG: { label: string; icon: IconName; to: string }[] = [
  { label: "Meal", icon: "forkSpoon", to: "/track/log-meal" },
  { label: "Water", icon: "droplet", to: "/track/water" },
  { label: "Activity", icon: "activity", to: "/track/activity" },
  { label: "Weight", icon: "weightScale", to: "/track/weight" },
];

const ACTIVE = "var(--color-accent)";
const IDLE = "var(--color-text-secondary)";

/** Routes that show their own full-bleed header and hide the tab bar spacing. */
const IMMERSIVE = /^\/recipes\/[^/]+\/(ingredients|cook)$|^\/you\/personal-details$/;
const showsBottomPad = (pathname: string) => !IMMERSIVE.test(pathname);

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
  const { unreadCount } = useNotifications();
  const name = firstNameOf(profile);
  return (
    <header className="sticky top-0 z-30 border-b border-border-divider bg-brand-cream/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          onClick={() => navigate("/search")}
          className={cn(
            PILL,
            "tap-44 relative flex h-10 min-w-0 flex-1 items-center gap-2.5 px-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:max-w-md",
          )}
        >
          <span className="shrink-0">
            <Icon name="search" size={16} color="var(--color-text-secondary)" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] type-meta text-text-neutral-400">
            Search food, recipes and hacks
          </span>
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {session.isSignedIn && (
            <Link
              to="/you/notifications"
              aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
              title="Notifications"
              className="tap-44 relative flex size-10 items-center justify-center rounded-full border border-border-default bg-white"
            >
              <Icon name="bell" size={18} color="var(--color-brand-navy)" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full border-2 border-white bg-primary text-[9px] type-meta text-white"
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <Link
            to="/you"
            className="tap-44 relative flex items-center gap-2 rounded-full border border-border-default bg-white py-1.5 pl-1.5 pr-3"
            aria-label={name ? `Account: ${name}` : "Account"}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft">
              <Icon name="userCircle" size={16} color="var(--color-primary)" />
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

function SideRail({ pathname }: { pathname: string }) {
  const inTrack = pathname.startsWith("/track");
  return (
    <nav
      aria-label="Main"
      data-variant="rail"
      className="panel sticky top-0 flex h-[calc(100dvh-1.25rem)] w-52 shrink-0 flex-col overflow-y-auto p-3 shadow-card lg:w-64 lg:p-4"
    >
      <Link to="/home" className="tap-44 relative mb-4 flex shrink-0 items-center px-1" aria-label="ForkThis home">
        <Logo size="md" decorative />
      </Link>
      <div className="flex flex-col gap-1">
        {MAIN_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                "tap-44 relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "type-button text-accent-ink"
                  : "type-button-secondary text-text-secondary hover:bg-brand-warm-gray",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={tab.icon} size={20} color={isActive ? ACTIVE : IDLE} />
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className={inTrack ? "hidden" : "mt-auto hidden lg:block"}>
        <p className="eyebrow px-3 pb-2">Quick log</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_LOG.map((q) => (
            <Link
              key={q.label}
              to={q.to}
              className="flex min-h-20 flex-col justify-between rounded-xl bg-brand-warm-gray p-3 text-xs type-button-secondary text-text-primary transition-colors hover:bg-primary-soft"
            >
              <Icon name={q.icon} size={18} color="var(--color-primary)" />
              {q.label}
            </Link>
          ))}
        </div>
      </div>
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
                      "mt-[3px] text-[11px] leading-none",
                      isActive ? "type-button text-accent-ink" : "type-button-secondary text-text-secondary",
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
        <div className={cn(desktop && "flex gap-2.5 p-2.5")}>
          {desktop && <SideRail pathname={pathname} />}
          <div className="min-w-0 flex-1">
            {desktop && <TopBar />}
            <main
              id="main"
              ref={main}
              tabIndex={-1}
              className={cn("min-w-0 focus:outline-none", pad ? "pb-[76px] md:pb-6" : !desktop && "pb-[60px]")}
            >
              {children}
            </main>
          </div>
        </div>
        {!desktop && <TabBar />}
      </div>
    </GuestGateProvider>
  );
}
