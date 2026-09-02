"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { DataState } from "@/components/DataState";
import { ItemCard } from "@/components/ItemCard";
import { Spinner } from "@/components/ui/spinner";
import { useApiResource, useDebouncedValue } from "@/lib/hooks";
import { recipesApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import listStyles from "../list.module.css";

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  const recipes = useApiResource(
    () => recipesApi.listRecipes({ search: debouncedSearch || undefined, limit: 24 }),
    [debouncedSearch],
  );

  const searching = recipes.isLoading && recipes.data !== null;

  return (
    <div>
      <header className={listStyles.header}>
        <h1 className={listStyles.heading}>Recipes</h1>
        <p className={listStyles.subheading}>Cook-at-home meals matched to your goals.</p>
      </header>

      <div className={listStyles.searchField}>
        <Search className={listStyles.searchIcon} aria-hidden="true" />
        <input
          className={listStyles.searchInput}
          type="search"
          aria-label="Search recipes"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searching ? <Spinner className={listStyles.searchSpinner} /> : null}
      </div>

      <DataState
        resource={recipes}
        isEmpty={(data) => data.items.length === 0}
        emptyTitle="No recipes found"
        emptyDescription={
          debouncedSearch
            ? `Nothing matches “${debouncedSearch}”.`
            : "There are no recipes in the catalog yet."
        }
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
