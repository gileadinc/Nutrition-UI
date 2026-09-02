"use client";

import Link from "next/link";
import { DataState } from "@/components/DataState";
import { MacroSummary } from "@/components/MacroSummary";
import { HomeGuidance } from "@/components/HomeGuidance";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/lib/hooks";
import { discoveryApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function DashboardPage() {
  const home = useApiResource(() => discoveryApi.getHome(), []);

  return (
    <div>
      <DataState resource={home}>
        {(feed) => (
          <>
            <header className={styles.header}>
              <h1 className={styles.heading}>{feed.greeting || "Today"}</h1>
              {feed.goal ? (
                <p className={styles.subheading}>
                  Goal: <strong>{feed.goal.replace(/_/g, " ")}</strong>
                </p>
              ) : (
                <p className={styles.subheading}>
                  <Link href={ROUTES.onboarding.goals}>Set a goal</Link> to personalize your
                  targets.
                </p>
              )}
            </header>

            {feed.guidance ? <HomeGuidance guidance={feed.guidance} /> : null}

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Today&apos;s progress</h2>
                <Link href={ROUTES.track} className={styles.sectionLink}>
                  Log a meal
                </Link>
              </div>
              {feed.todayProgress ? (
                <MacroSummary summary={feed.todayProgress} />
              ) : (
                <p className={styles.muted}>No tracking data yet.</p>
              )}
            </section>

            {feed.recommendations?.recipes?.length ? (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>Recommended recipes</h2>
                  <Link href={ROUTES.recipes} className={styles.sectionLink}>
                    Browse all
                  </Link>
                </div>
                <div className={styles.grid}>
                  {feed.recommendations.recipes.slice(0, 4).map((recipe) => (
                    <ItemCard
                      key={recipe.id}
                      href={ROUTES.recipe(recipe.id)}
                      title={recipe.title}
                      subtitle={recipe.description}
                      meta={`${recipe.calories} kcal · ${recipe.protein}g protein · ${recipe.carbs}g carbs · ${recipe.fat}g fat · ${recipe.prepTimeMinutes} min · ${recipe.servings} serving${recipe.servings === 1 ? "" : "s"}`}
                      tags={recipe.goalTags}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {feed.recommendations?.restaurants?.length ? (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>Places to eat</h2>
                  <Link href={ROUTES.eatOut} className={styles.sectionLink}>
                    Browse all
                  </Link>
                </div>
                <div className={styles.grid}>
                  {feed.recommendations.restaurants.slice(0, 4).map((r) => (
                    <ItemCard
                      key={r.id}
                      href={ROUTES.restaurant(r.id)}
                      title={r.name}
                      subtitle={r.summary}
                      meta={`${r.city}, ${r.state}`}
                      tags={r.bestForGoals}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <div className={styles.footerCta}>
              <Link href={ROUTES.guestHome}>
                <Button variant="outline">Open the discovery feed</Button>
              </Link>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
