"use client";

import { useMemo } from "react";
import {
  AllergenWarning,
  CenteredShell,
  DetailFrame,
  DetailPageSkeleton,
  DetailSection,
  Disclosure,
  IngredientsPanel,
  MacroDonut,
  MedicalNote,
  MethodPanel,
  NutritionLine,
  PrimaryButton,
  RelatedHeading,
  RelatedRow,
  SaveHeartButton,
  SecondaryButton,
  StatePanel,
  SurgeryNote,
  TwoPaneDetail,
  relatedItems,
  usePortionSheet,
  useRecoveringFromSurgery,
} from "@/components";
import { getErrorMessage } from "@/lib/api";
import { useNavigate, useParams } from "@/lib/nav";
import { fitFor } from "@/lib/nutrition";
import { useDayBudget, useProfile, useRecipe, useRecipes, useSaved } from "@/lib/store";
import { toRecipeVM } from "./adapt";

export function RecipeDetailScreen() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const one = useRecipe(id);
  const list = useRecipes({ limit: 100 });
  const saved = useSaved();
  const { profile } = useProfile();
  const { budget } = useDayBudget();
  const surgery = useRecoveringFromSurgery();
  const portion = usePortionSheet({ context: "cook" });
  const all = useMemo(() => (list.data?.items ?? []).map(toRecipeVM), [list.data]);

  if (one.isLoading && !one.data) return <DetailPageSkeleton />;
  if (!one.data)
    return (
      <CenteredShell>
        <StatePanel
          icon="search"
          title="That recipe isn't here"
          body={
            one.error
              ? getErrorMessage(one.error)
              : "It may have been removed from the catalogue, or the link may be out of date."
          }
          primary={{ label: "Browse recipes", to: "/recipes" }}
          secondary={{ label: "Go to Home", to: "/home" }}
        />
      </CenteredShell>
    );

  const r = toRecipeVM(one.data);
  const idx = all.findIndex((x) => x.id === r.id);
  const neighbour = (d: number) => {
    const t = idx < 0 ? undefined : all[idx + d];
    return t ? { to: `/recipes/${t.id}`, title: t.title } : undefined;
  };
  const related = relatedItems(r, all, (x) => x.tags);
  const isSaved = saved.isSaved("recipe", r.id);

  return (
    <>
      <TwoPaneDetail
        listLabel="Recipes"
        listTitle="RECIPES"
        activeId={r.id}
        items={all.map((x) => ({
          id: x.id,
          title: x.title,
          subtitle: `${x.time} · ${x.calories} kcal`,
          image: x.image,
          to: `/recipes/${x.id}`,
        }))}
      >
        <DetailFrame
          image={r.image}
          badge={r.badge}
          title={r.title}
          subtitle={r.time}
          fallbackRoute="/recipes"
          fit={fitFor(r, budget)}
          prev={neighbour(-1)}
          next={neighbour(1)}
          footer={
            <>
              <SaveHeartButton
                pressed={isSaved}
                onToggle={() =>
                  void saved.toggle({
                    itemType: "recipe",
                    itemId: r.id,
                    title: r.title,
                    subtitle: r.time,
                  })
                }
                label="Save recipe"
                title={isSaved ? "Saved" : "Save"}
                size={22}
                className="size-14 shrink-0 rounded-2xl border border-border-default shadow-none"
              />
              <SecondaryButton
                label="Log this meal"
                className="text-onb-body"
                onPress={() =>
                  portion.open({
                    id: r.id,
                    title: r.title,
                    subtitle: r.time,
                    calories: r.calories,
                    protein: r.protein,
                    carbs: r.carbs,
                    fat: r.fat,
                    sourceType: "recipe",
                  })
                }
              />
              <PrimaryButton label="Cook" onPress={() => navigate(`/recipes/${r.id}/ingredients`)} />
            </>
          }
        >
          <NutritionLine
            calories={r.calories}
            protein={r.protein}
            carbs={r.carbs}
            fat={r.fat}
            label="Nutrition per serving"
          />
          <AllergenWarning recipe={r} userAllergies={profile?.allergies ?? []} />
          <IngredientsPanel items={r.ingredients} />
          <MethodPanel steps={r.steps} />
          {surgery && (
            <SurgeryNote>
              Follow your care team&apos;s guidance on how much to eat, and log the portion you
              actually have.
            </SurgeryNote>
          )}
          {r.description && (
            <DetailSection title="About this dish">
              <p className="text-onb-body text-text-secondary">{r.description}</p>
            </DetailSection>
          )}
          <Disclosure title="Full nutrition" summary="Macro split">
            <MacroDonut
              macros={{ protein: r.protein, carbs: r.carbs, fat: r.fat }}
              total={r.calories}
              variant="detail"
            />
          </Disclosure>
          <MedicalNote />
          {related.length > 0 && (
            <section className="flex flex-col gap-3 border-t border-border-divider pt-5">
              <RelatedHeading>More to cook</RelatedHeading>
              <div className="flex flex-col gap-2.5">
                {related.map((x) => (
                  <RelatedRow
                    key={x.id}
                    image={x.image}
                    title={x.title}
                    subtitle={`${x.time} · ${x.calories} kcal`}
                    tag={x.badge}
                    to={`/recipes/${x.id}`}
                  />
                ))}
              </div>
            </section>
          )}
        </DetailFrame>
      </TwoPaneDetail>
      {portion.sheet}
    </>
  );
}
