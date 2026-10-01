"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { CheckMark } from "@/components/Layout";
import { EmptyState } from "@/components/Feedback";
import { FoodCard } from "@/components/Cards";
import { FormSection, ProfileLayout } from "@/components/Track/ProfileParts";
import { Link, useSearchParams } from "@/lib/nav";
import { useAppSession, useSaved } from "@/lib/store";
import { SELECTED_CHIP } from "@/components/styles";

const TABS = [
  { value: "all", label: "All" },
  { value: "hacks", label: "Fast Hacks" },
  { value: "recipes", label: "Recipes" },
] as const;
type Tab = (typeof TABS)[number]["value"];
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const LINK = "type-button text-primary underline underline-offset-2";

export function SavedScreen() {
  const session = useAppSession();
  const saved = useSaved();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab = tabParam === "hacks" || tabParam === "recipes" ? tabParam : "all";
  const uid = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const hacks = saved.items.filter((i) => i.itemType === "fast_hack");
  const recipes = saved.items.filter((i) => i.itemType === "recipe");
  const empty = hacks.length === 0 && recipes.length === 0;

  const select = (v: Tab) => {
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const last = TABS.length - 1;
    const to =
      e.key === "ArrowRight"
        ? i === last ? 0 : i + 1
        : e.key === "ArrowLeft"
          ? i === 0 ? last : i - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (to !== null) {
      e.preventDefault();
      select(TABS[to].value);
      tabs.current[to]?.focus();
    }
  };

  const grid = (kind: "recipe" | "fast_hack", list: typeof saved.items) => (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {list.map((i) => (
        <li key={i.savedItemId} className="min-w-0">
          <FoodCard
            layout="grid"
            title={i.title}
            subtitle={i.subtitle ?? undefined}
            brandName={kind === "fast_hack" ? (i.subtitle ?? undefined) : undefined}
            meta={i.subtitle ?? (kind === "recipe" ? "Recipe" : "Fast hack")}
            saved
            onSave={() =>
              void saved.toggle({ itemType: i.itemType, itemId: i.itemId, title: i.title, subtitle: i.subtitle ?? undefined })
            }
            to={kind === "recipe" ? `/recipes/${i.itemId}` : `/hack/${i.itemId}`}
          />
        </li>
      ))}
    </ul>
  );

  const hackSection = (
    <FormSection title="Fast Hacks" action={String(hacks.length)}>
      {hacks.length === 0 ? (
        <p className="type-meta text-[13px] text-text-secondary">
          No saved fast hacks yet. Tap the heart on a hack to keep it here.{" "}
          <Link to="/fast-hacks" className={LINK}>
            Browse Fast Hacks
          </Link>
        </p>
      ) : (
        grid("fast_hack", hacks)
      )}
    </FormSection>
  );
  const recipeSection = (
    <FormSection title="Recipes" action={String(recipes.length)}>
      {recipes.length === 0 ? (
        <p className="type-meta text-[13px] text-text-secondary">
          No saved recipes yet. Tap the heart on a recipe to keep it here.{" "}
          <Link to="/recipes" className={LINK}>
            Browse recipes
          </Link>
        </p>
      ) : (
        grid("recipe", recipes)
      )}
    </FormSection>
  );

  const subtitle = empty
    ? "Hacks and recipes you keep for later."
    : `${plural(hacks.length, "fast hack", "fast hacks")} · ${plural(recipes.length, "recipe", "recipes")}`;

  return (
    <ProfileLayout title="Saved" subtitle={subtitle}>
      {session.isSignedIn && saved.isLoading && empty ? (
        <p className="panel p-4 text-[13px] type-meta text-text-secondary">Loading…</p>
      ) : empty || !session.isSignedIn ? (
        <>
          <EmptyState
            icon="bookmark"
            title="Nothing saved yet"
            body="Tap the heart on any hack or recipe to keep it here for your next order or shop."
            action={{ label: "Browse Fast Hacks", to: "/fast-hacks" }}
          />
          <p className="mt-3 text-center type-meta text-[13px] text-text-secondary">
            Or{" "}
            <Link to="/recipes" className={LINK}>
              browse recipes
            </Link>
          </p>
        </>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Saved items"
            className="mb-5 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-1 rounded-2xl bg-brand-warm-gray p-1"
          >
            {TABS.map((t, i) => {
              const on = t.value === tab;
              return (
                <button
                  key={t.value}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${t.value}`}
                  aria-selected={on}
                  aria-controls={`${uid}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(t.value)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-1 rounded-xl border px-2 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
                    on
                      ? cn(SELECTED_CHIP, "type-button")
                      : "type-button-secondary border-transparent text-text-primary hover:bg-white",
                  )}
                >
                  {on && <CheckMark size={12} />}
                  {t.label}
                </button>
              );
            })}
          </div>
          <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tab}`} className="flex flex-col gap-7">
            {tab === "all" ? (
              <>
                {hacks.length > 0 && hackSection}
                {recipes.length > 0 && recipeSection}
              </>
            ) : tab === "hacks" ? (
              hackSection
            ) : (
              recipeSection
            )}
          </div>
        </>
      )}
    </ProfileLayout>
  );
}
