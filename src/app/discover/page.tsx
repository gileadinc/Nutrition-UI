"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, MapPin, LineChart, Search, ArrowRight } from "lucide-react";
import { Container } from "@/components/Container";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/lib/hooks";
import { discoveryApi, type Recipe } from "@/lib/api";
import { ensureGuestSession, useSession } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

const QUICK_ACTION_ICONS: Record<string, typeof ChefHat> = {
  cook: ChefHat,
  eat_out: MapPin,
  track: LineChart,
};

export default function DiscoverPage() {
  const session = useSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureGuestSession()
      .then((id) => {
        if (!cancelled) setSessionId(id);
      })
      .catch(() => {
        // guest home also works without a session id
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const home = useApiResource(
    () => discoveryApi.getGuestHome({ sessionId: sessionId ?? undefined }),
    [sessionId],
    { enabled: ready },
  );

  return (
    <Container>
      <div className={styles.page}>
        <DataState resource={home}>
          {(data) => (
            <>
              <header className={styles.header}>
                <p className={styles.eyebrow}>Discover</p>
                <h1 className={styles.heading}>{data.greeting}</h1>
                <p className={styles.prompt}>{data.promptTitle}</p>
                {!session.accessToken ? (
                  <div className={styles.headerCta}>
                    <Link href={ROUTES.register}>
                      <Button size="lg">Create an account</Button>
                    </Link>
                    <Link href={ROUTES.login}>
                      <Button size="lg" variant="outline">
                        Sign in
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </header>

              {data.quickActions?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Start here</h2>
                  <div className={styles.quickActions}>
                    {data.quickActions.map((action) => {
                      const Icon = QUICK_ACTION_ICONS[action.key] ?? Search;
                      return (
                        <Link
                          key={action.key}
                          href={ROUTES.register}
                          className={styles.quickAction}
                        >
                          <span className={styles.quickActionIcon}>
                            <Icon className="size-4" />
                          </span>
                          <span className={styles.quickActionBody}>
                            <span className={styles.quickActionLabel}>{action.label}</span>
                            {action.requiresAccount ? (
                              <span className={styles.quickActionHint}>Requires an account</span>
                            ) : null}
                          </span>
                          <ArrowRight className={styles.quickActionArrow} />
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {data.featuredRecipes?.length ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>Featured recipes</h2>
                    <Link href={ROUTES.register} className={styles.sectionLink}>
                      Sign up for the full library
                    </Link>
                  </div>
                  <div className={styles.recipeGrid}>
                    {data.featuredRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                  </div>
                </section>
              ) : null}

              {data.featuredRestaurants?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Places to eat</h2>
                  <div className={styles.recipeGrid}>
                    {data.featuredRestaurants.map((r) => (
                      <div key={r.id} className={styles.card}>
                        <p className={styles.cardTitle}>{r.name}</p>
                        <p className={styles.cardDescription}>{r.summary}</p>
                        <p className={styles.cardMeta}>
                          {r.city}
                          {r.state ? `, ${r.state}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {data.suggestedSearches?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>People are asking</h2>
                  <ul className={styles.searchList}>
                    {data.suggestedSearches.map((term) => (
                      <li key={term}>
                        <Link href={ROUTES.register} className={styles.searchItem}>
                          <Search className={styles.searchIcon} />
                          <span>{term}</span>
                          <ArrowRight className={styles.searchArrow} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className={styles.footerCard}>
                <p className={styles.footerCardTitle}>Ready to make it yours?</p>
                <p className={styles.footerCardText}>
                  Create an account to save recipes, track your day, and get recommendations tuned
                  to your goals.
                </p>
                <Link href={ROUTES.register}>
                  <Button size="lg">Get started</Button>
                </Link>
              </div>
            </>
          )}
        </DataState>
      </div>
    </Container>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className={styles.card}>
      <p className={styles.cardTitle}>{recipe.title}</p>
      <p className={styles.cardDescription}>{recipe.description}</p>

      <dl className={styles.nutrition}>
        <div>
          <dt>Calories</dt>
          <dd>{recipe.calories}</dd>
        </div>
        <div>
          <dt>Protein</dt>
          <dd>{recipe.protein}g</dd>
        </div>
        <div>
          <dt>Carbs</dt>
          <dd>{recipe.carbs}g</dd>
        </div>
        <div>
          <dt>Fat</dt>
          <dd>{recipe.fat}g</dd>
        </div>
      </dl>

      <p className={styles.cardMeta}>
        {recipe.prepTimeMinutes} min · {recipe.servings} serving
        {recipe.servings === 1 ? "" : "s"}
        {recipe.category ? ` · ${recipe.category}` : ""}
      </p>

      {recipe.goalTags?.length ? (
        <div className={styles.tags}>
          {recipe.goalTags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
