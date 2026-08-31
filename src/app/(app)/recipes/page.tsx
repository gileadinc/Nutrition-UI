"use client";

import { FormEvent, useState } from "react";
import { DataState } from "@/components/DataState";
import { ItemCard } from "@/components/ItemCard";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/lib/hooks";
import { recipesApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import listStyles from "../list.module.css";

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const recipes = useApiResource(
    () => recipesApi.listRecipes({ search: applied || undefined, limit: 24 }),
    [applied],
  );

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setApplied(search.trim());
  }

  return (
    <div>
      <header className={listStyles.header}>
        <h1 className={listStyles.heading}>Recipes</h1>
        <p className={listStyles.subheading}>Cook-at-home meals matched to your goals.</p>
      </header>

      <form className={listStyles.searchRow} onSubmit={handleSearch}>
        <TextField
          aria-label="Search recipes"
          type="search"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <DataState
        resource={recipes}
        isEmpty={(data) => data.items.length === 0}
        emptyTitle="No recipes found"
        emptyDescription="Try a different search term."
      >
        {(data) => (
          <>
            <div className={listStyles.grid}>
              {data.items.map((recipe) => (
                <ItemCard
                  key={recipe.id}
                  href={ROUTES.recipe(recipe.id)}
                  title={recipe.title}
                  subtitle={recipe.description}
                  meta={`${recipe.calories} kcal · ${recipe.protein}g protein · ${recipe.prepTimeMinutes} min`}
                  tags={recipe.goalTags}
                />
              ))}
            </div>
            <p className={listStyles.count}>
              {data.pagination.total} recipe{data.pagination.total === 1 ? "" : "s"}
            </p>
          </>
        )}
      </DataState>
    </div>
  );
}
