"use client";

import Link from "next/link";
import {
  Users,
  ClipboardList,
  NotebookPen,
  Bookmark,
  UtensilsCrossed,
  Store,
  ListOrdered,
  Zap,
} from "lucide-react";
import { DataState } from "@/components/DataState";
import { useApiResource } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function AdminDashboardPage() {
  const dashboard = useApiResource(() => adminApi.getDashboard(), []);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.heading}>Dashboard</h1>
        <p className={styles.subheading}>Platform activity and catalog health.</p>
      </header>

      <DataState resource={dashboard}>
        {(data) => (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Overview</h2>
              <div className={styles.statGrid}>
                <Stat icon={<Users />} label="Users" value={data.overview.users} />
                <Stat
                  icon={<ClipboardList />}
                  label="Onboarding sessions"
                  value={data.overview.onboardingSessions}
                />
                <Stat
                  icon={<NotebookPen />}
                  label="Nutrition logs"
                  value={data.overview.nutritionLogs}
                />
                <Stat icon={<Bookmark />} label="Saved items" value={data.overview.savedItems} />
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Catalog</h2>
              <div className={styles.statGrid}>
                <Stat
                  icon={<UtensilsCrossed />}
                  label="Recipes"
                  value={data.overview.recipes}
                  href={ROUTES.admin.recipes}
                />
                <Stat
                  icon={<Store />}
                  label="Restaurants"
                  value={data.overview.restaurants}
                  href={ROUTES.admin.restaurants}
                />
                <Stat
                  icon={<ListOrdered />}
                  label="Menu items"
                  value={data.overview.menuItems}
                  href={ROUTES.admin.menuItems}
                />
                <Stat
                  icon={<Zap />}
                  label="Fast Hacks"
                  value={data.overview.fastHacks}
                  href={ROUTES.admin.fastHacks}
                />
              </div>

              <div className={styles.metricRow}>
                <Metric label="Total catalog items" value={data.catalog.totalItems} />
                <Metric
                  label="Restaurants with menus"
                  value={data.catalog.restaurantsWithMenus}
                />
                <Metric
                  label="Avg menu items / restaurant"
                  value={round(data.catalog.averageMenuItemsPerRestaurant)}
                />
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Engagement</h2>
              <div className={styles.metricRow}>
                <Metric label="Users who logged" value={data.engagement.usersWhoLogged} />
                <Metric
                  label="Avg logs / user"
                  value={round(data.engagement.averageLogsPerUser)}
                />
                <Metric
                  label="Saved items / user"
                  value={round(data.engagement.savedItemsPerUser)}
                />
              </div>
            </section>
          </>
        )}
      </DataState>
    </div>
  );
}

function round(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function Stat({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className={styles.statLink}>
      {inner}
    </Link>
  ) : (
    <div className={styles.stat}>{inner}</div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}
