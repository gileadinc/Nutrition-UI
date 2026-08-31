"use client";

import { FormEvent, useState } from "react";
import { DataState } from "@/components/DataState";
import { ItemCard } from "@/components/ItemCard";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApiResource } from "@/lib/hooks";
import { eatOutApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import listStyles from "../list.module.css";

export default function EatOutPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const restaurants = useApiResource(
    () => eatOutApi.listRestaurants({ search: applied || undefined, limit: 24 }),
    [applied],
  );
  const fastHacks = useApiResource(
    () => eatOutApi.listFastHacks({ search: applied || undefined, limit: 24 }),
    [applied],
  );

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setApplied(search.trim());
  }

  return (
    <div>
      <header className={listStyles.header}>
        <h1 className={listStyles.heading}>Eat out</h1>
        <p className={listStyles.subheading}>
          What to order at real restaurants, plus quick Fast Hacks.
        </p>
      </header>

      <form className={listStyles.searchRow} onSubmit={handleSearch}>
        <TextField
          aria-label="Search eat-out options"
          type="search"
          placeholder="Search restaurants or hacks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <Tabs defaultValue="restaurants">
        <TabsList>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="fast-hacks">Fast Hacks</TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants">
          <DataState
            resource={restaurants}
            isEmpty={(d) => d.items.length === 0}
            emptyTitle="No restaurants yet"
            emptyDescription="No restaurants match this search in the current catalog."
          >
            {(data) => (
              <div className={listStyles.grid}>
                {data.items.map((r) => (
                  <ItemCard
                    key={r.id}
                    href={ROUTES.restaurant(r.id)}
                    title={r.name}
                    subtitle={r.summary}
                    meta={`${r.city}, ${r.state} · ${r.testedOrderCount} tested orders`}
                    tags={r.bestForGoals}
                  />
                ))}
              </div>
            )}
          </DataState>
        </TabsContent>

        <TabsContent value="fast-hacks">
          <DataState
            resource={fastHacks}
            isEmpty={(d) => d.items.length === 0}
            emptyTitle="No Fast Hacks yet"
            emptyDescription="No Fast Hacks match this search in the current catalog."
          >
            {(data) => (
              <div className={listStyles.grid}>
                {data.items.map((h) => (
                  <ItemCard
                    key={h.id}
                    href={ROUTES.fastHack(h.id)}
                    title={h.title}
                    subtitle={h.summary ?? h.description}
                    tags={h.goalTags}
                  />
                ))}
              </div>
            )}
          </DataState>
        </TabsContent>
      </Tabs>
    </div>
  );
}
