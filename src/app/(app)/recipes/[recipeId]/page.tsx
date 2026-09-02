"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Users, ChevronRight, Flame } from "lucide-react";
import { DataState } from "@/components/DataState";
import { SaveButton } from "@/components/SaveButton";
import { useApiResource } from "@/lib/hooks";
import { recipesApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = use(params);
  const recipe = useApiResource(() => recipesApi.getRecipe(recipeId), [recipeId]);
  // Loaded alongside the recipe; rendered inline only once we have data, so the
  // page shows a single loading state rather than two stacked spinners.
  const similar = useApiResource(
    () => recipesApi.getSimilarRecipes(recipeId, 4),
    [recipeId],
  );

  return (
    <div>
      <Link href={ROUTES.recipes} className={styles.back}>
        <ArrowLeft className="size-4" />
        All recipes
      </Link>

      <DataState resource={recipe}>
        {(data) => (
          <article>
            <header className={styles.header}>
              <div className={styles.headerText}>
                {data.category ? (
                  <span className={styles.category}>{data.category}</span>
                ) : null}
                <h1 className={styles.title}>{data.title}</h1>
                <p className={styles.description}>{data.description}</p>
              </div>
              <SaveButton
                itemType="recipe"
                itemId={data.id}
                title={data.title}
                subtitle={data.category}
              />
            </header>

            <div className={styles.quickFacts}>
              <span className={styles.fact}>
                <Flame className="size-4" />
                {data.calories} kcal
              </span>
              <span className={styles.fact}>
                <Clock className="size-4" />
                {data.prepTimeMinutes} min
              </span>
              <span className={styles.fact}>
                <Users className="size-4" />
                {data.servings} serving{data.servings === 1 ? "" : "s"}
              </span>
            </div>

            <div className={styles.macros}>
              <Macro label="Calories" value={`${data.calories}`} accent />
              <Macro label="Protein" value={`${data.protein}g`} />
              <Macro label="Carbs" value={`${data.carbs}g`} />
              <Macro label="Fat" value={`${data.fat}g`} />
            </div>

            <div className={styles.columns}>
              {data.ingredients?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Ingredients</h2>
                  <ul className={styles.ingredients}>
                    {data.ingredients.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {data.steps?.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Method</h2>
                  <ol className={styles.steps}>
                    {data.steps.map((step, i) => (
                      <li key={i}>
                        <span className={styles.stepNumber}>{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </div>

            {similar.data && similar.data.length > 0 ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Similar recipes</h2>
                <ul className={styles.similar}>
                  {similar.data.map((item) => (
                    <li key={item.id}>
                      <Link href={ROUTES.recipe(item.id)} className={styles.similarLink}>
                        <span className={styles.similarText}>
                          <span className={styles.similarTitle}>{item.title}</span>
                          <span className={styles.similarMeta}>
                            {item.calories} kcal · {item.protein}g protein
                          </span>
                        </span>
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>
        )}
      </DataState>
    </div>
  );
}

function Macro({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? styles.macroAccent : styles.macro}>
      <span className={styles.macroValue}>{value}</span>
      <span className={styles.macroLabel}>{label}</span>
    </div>
  );
}
