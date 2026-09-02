"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  MapPin,
  LineChart,
  Search,
  ArrowRight,
  Sparkles,
  Clock,
  Flame,
  Users,
} from "lucide-react";
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

const HOW_IT_WORKS = [
  {
    icon: Sparkles,
    title: "Tell us your goal",
    body: "Weight loss, muscle, maintenance, or recovery — we tune your targets.",
  },
  {
    icon: ChefHat,
    title: "Cook or order",
    body: "Get recipe ideas for home and exact orders for real restaurants.",
  },
  {
    icon: LineChart,
    title: "Track your day",
    body: "Log meals in seconds and watch your macros and water fill in.",
  },
];

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

  const authed = Boolean(session.accessToken);

  return (
    <div className={styles.page}>
      <DataState resource={home}>
        {(data) => (
          <>
            {/* ---- Hero ---- */}
            <section className={styles.hero}>
              <Container className={styles.heroInner}>
                <p className={styles.eyebrow}>
                  <Sparkles className="size-3.5" />
                  {data.greeting}
                </p>
                <h1 className={styles.heading}>{data.promptTitle}</h1>
                <p className={styles.lede}>
                  ForkThis! helps you choose what to order or cook when real life puts your healthier
                  habits on the spot — no calorie math, no guilt.
                </p>

                <form
                  className={styles.searchBar}
                  action={ROUTES.register}
                  onSubmit={(e) => e.preventDefault()}
                >
                  <Search className={styles.searchBarIcon} aria-hidden="true" />
                  <input
                    className={styles.searchInput}
                    placeholder="Search meals, places, or a craving…"
                    aria-label="Search"
                  />
                  <Link href={ROUTES.register} className={styles.searchGo}>
                    Search
                  </Link>
                </form>

                <div className={styles.heroCta}>
                  {authed ? (
                    <Link href={ROUTES.dashboard}>
                      <Button size="lg">
                        Go to your dashboard
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href={ROUTES.register}>
                        <Button size="lg">Create a free account</Button>
                      </Link>
                      <Link href={ROUTES.login}>
                        <Button size="lg" variant="outline">
                          Sign in
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </Container>
            </section>

            <Container className={styles.body}>
              {/* ---- Quick actions ---- */}
              {data.quickActions?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>What do you need right now?</h2>
                  <div className={styles.quickActions}>
                    {data.quickActions.map((action) => {
                      const Icon = QUICK_ACTION_ICONS[action.key] ?? Search;
                      return (
                        <Link
                          key={action.key}
                          href={authed ? ROUTES.dashboard : ROUTES.register}
                          className={styles.quickAction}
                        >
                          <span className={styles.quickActionIcon}>
                            <Icon className="size-5" />
                          </span>
                          <span className={styles.quickActionLabel}>{action.label}</span>
                          {action.requiresAccount && !authed ? (
                            <span className={styles.quickActionHint}>Account needed</span>
                          ) : null}
                          <ArrowRight className={styles.quickActionArrow} />
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {/* ---- Featured recipes ---- */}
              {data.featuredRecipes?.length ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div>
                      <h2 className={styles.sectionTitle}>Recipes to try tonight</h2>
                      <p className={styles.sectionSub}>Balanced, quick, and goal-friendly.</p>
                    </div>
                    <Link
                      href={authed ? ROUTES.recipes : ROUTES.register}
                      className={styles.sectionLink}
                    >
                      See all
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                  <div className={styles.recipeGrid}>
                    {data.featuredRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        href={authed ? ROUTES.recipe(recipe.id) : ROUTES.register}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* ---- Restaurants ---- */}
              {data.featuredRestaurants?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Places to eat</h2>
                  <div className={styles.recipeGrid}>
                    {data.featuredRestaurants.map((r) => (
                      <Link
                        key={r.id}
                        href={authed ? ROUTES.restaurant(r.id) : ROUTES.register}
                        className={styles.placeCard}
                      >
                        <p className={styles.cardTitle}>{r.name}</p>
                        <p className={styles.cardDescription}>{r.summary}</p>
                        <p className={styles.cardMeta}>
                          <MapPin className="size-3.5" />
                          {r.city}
                          {r.state ? `, ${r.state}` : ""}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* ---- Suggested searches ---- */}
              {data.suggestedSearches?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>People are asking</h2>
                  <div className={styles.chips}>
                    {data.suggestedSearches.map((term) => (
                      <Link
                        key={term}
                        href={authed ? ROUTES.dashboard : ROUTES.register}
                        className={styles.chip}
                      >
                        <Search className="size-3.5" />
                        {term}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* ---- How it works ---- */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>How ForkThis! works</h2>
                <div className={styles.steps}>
                  {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
                    <div key={title} className={styles.stepCard}>
                      <span className={styles.stepNumber}>{i + 1}</span>
                      <Icon className={styles.stepIcon} aria-hidden="true" />
                      <p className={styles.stepTitle}>{title}</p>
                      <p className={styles.stepBody}>{body}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---- Final CTA ---- */}
              {!authed ? (
                <section className={styles.finalCta}>
                  <h2 className={styles.finalCtaTitle}>Ready to make it yours?</h2>
                  <p className={styles.finalCtaText}>
                    Create a free account to save recipes, track your day, and get recommendations
                    tuned to your goals.
                  </p>
                  <Link href={ROUTES.register}>
                    <Button size="lg">Get started — it&apos;s free</Button>
                  </Link>
                </section>
              ) : null}
            </Container>
          </>
        )}
      </DataState>
    </div>
  );
}

function RecipeCard({ recipe, href }: { recipe: Recipe; href: string }) {
  return (
    <Link href={href} className={styles.recipeCard}>
      <div className={styles.recipeCardHead}>
        <p className={styles.cardTitle}>{recipe.title}</p>
        {recipe.category ? (
          <span className={styles.recipeCategory}>{recipe.category}</span>
        ) : null}
      </div>
      <p className={styles.cardDescription}>{recipe.description}</p>

      <div className={styles.recipeFacts}>
        <span>
          <Flame className="size-3.5" />
          {recipe.calories} kcal
        </span>
        <span>
          <Clock className="size-3.5" />
          {recipe.prepTimeMinutes} min
        </span>
        <span>
          <Users className="size-3.5" />
          {recipe.servings}
        </span>
      </div>

      <dl className={styles.nutrition}>
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

      {recipe.goalTags?.length ? (
        <div className={styles.tags}>
          {recipe.goalTags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
