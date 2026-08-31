"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { DataState } from "@/components/DataState";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/lib/hooks";
import { discoveryApi } from "@/lib/api";
import { ensureGuestSession, useSession } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

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
        {!session.accessToken ? (
          <div className={styles.guestBanner}>
            <span>Browsing as a guest.</span>
            <Link href={ROUTES.register}>
              <Button size="sm">Create an account</Button>
            </Link>
          </div>
        ) : null}

        <DataState resource={home}>
          {(data) => (
            <>
              <header className={styles.header}>
                <h1 className={styles.heading}>{data.greeting}</h1>
                <p className={styles.prompt}>{data.promptTitle}</p>
              </header>

              {data.quickActions?.length ? (
                <div className={styles.quickActions}>
                  {data.quickActions.map((action) => (
                    <span key={action.key} className={styles.quickAction}>
                      {action.label}
                      {action.requiresAccount ? (
                        <span className={styles.lock}>account</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}

              {data.featuredRecipes?.length ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>Featured recipes</h2>
                    <Link href={ROUTES.login} className={styles.sectionLink}>
                      Sign in for more
                    </Link>
                  </div>
                  <div className={styles.grid}>
                    {data.featuredRecipes.map((recipe) => (
                      <ItemCard
                        key={recipe.id}
                        href={ROUTES.login}
                        title={recipe.title}
                        subtitle={recipe.description}
                        meta={`${recipe.calories} kcal · ${recipe.protein}g protein`}
                        tags={recipe.goalTags}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {data.featuredRestaurants?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Places to eat</h2>
                  <div className={styles.grid}>
                    {data.featuredRestaurants.map((r) => (
                      <ItemCard
                        key={r.id}
                        href={ROUTES.login}
                        title={r.name}
                        subtitle={r.summary}
                        meta={`${r.city}, ${r.state}`}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {data.suggestedSearches?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Popular searches</h2>
                  <div className={styles.chips}>
                    {data.suggestedSearches.map((term) => (
                      <span key={term} className={styles.chip}>
                        {term}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </DataState>
      </div>
    </Container>
  );
}
