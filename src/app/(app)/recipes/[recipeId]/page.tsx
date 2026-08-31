"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DataState } from "@/components/DataState";
import { ItemCard } from "@/components/ItemCard";
import { SaveButton } from "@/components/SaveButton";
import { useApiResource } from "@/lib/hooks";
import { recipesApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "../../detail.module.css";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = use(params);
  const recipe = useApiResource(() => recipesApi.getRecipe(recipeId), [recipeId]);
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
          <>
            <header className={styles.header}>
              <div>
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

            <div className={styles.macros}>
              <Macro label="Calories" value={`${data.calories}`} />
              <Macro label="Protein" value={`${data.protein} g`} />
              <Macro label="Carbs" value={`${data.carbs} g`} />
              <Macro label="Fat" value={`${data.fat} g`} />
              <Macro label="Prep" value={`${data.prepTimeMinutes} min`} />
              <Macro label="Servings" value={`${data.servings}`} />
            </div>

            {data.ingredients?.length ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Ingredients</h2>
                <ul className={styles.list}>
                  {data.ingredients.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {data.steps?.length ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Steps</h2>
                <ol className={styles.steps}>
                  {data.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </section>
            ) : null}
          </>
        )}
      </DataState>

      <DataState resource={similar} isEmpty={(d) => d.length === 0} emptyTitle="">
        {(items) => (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Similar recipes</h2>
            <div className={styles.grid}>
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  href={ROUTES.recipe(item.id)}
                  title={item.title}
                  subtitle={item.description}
                  meta={`${item.calories} kcal`}
                />
              ))}
            </div>
          </section>
        )}
      </DataState>
    </div>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.macro}>
      <span className={styles.macroValue}>{value}</span>
      <span className={styles.macroLabel}>{label}</span>
    </div>
  );
}
