"use client";

import { useMemo } from "react";
import {
  CenteredShell,
  CheckBullet,
  CounterScript,
  DetailFrame,
  DetailPageSkeleton,
  DetailSection,
  Disclosure,
  DotBullet,
  MacroDonut,
  MedicalNote,
  NutritionLine,
  PrimaryButton,
  RelatedHeading,
  RelatedRow,
  RestaurantNote,
  SecondaryButton,
  StatePanel,
  SurgeryNote,
  TwoPaneDetail,
  relatedItems,
  usePortionSheet,
  useRecoveringFromSurgery,
} from "@/components";
import { getErrorMessage } from "@/lib/api";
import { useParams } from "@/lib/nav";
import { fitFor } from "@/lib/nutrition";
import { useDayBudget, useFastHack, useFastHacks, useMenuItem, useSaved } from "@/lib/store";
import { menuItemToHack, toHackVM } from "./adapt";

export function HackDetailScreen() {
  const { id = "" } = useParams<{ id: string }>();
  const hack = useFastHack(id);
  // Search returns restaurant menu items; fall back to one when the id is not a fast hack.
  const fallbackMenu = useMenuItem(hack.error && !hack.data ? id : null);
  const menu = useMenuItem(hack.data && typeof hack.data.menuItemId === "string" ? hack.data.menuItemId : null);
  const list = useFastHacks({ limit: 100 });
  const saved = useSaved();
  const { budget } = useDayBudget();
  const surgery = useRecoveringFromSurgery();
  const portion = usePortionSheet({ context: "fork" });
  const all = useMemo(() => (list.data?.items ?? []).map((h) => toHackVM(h)), [list.data]);

  const loading = (hack.isLoading && !hack.data) || (!!hack.error && fallbackMenu.isLoading && !fallbackMenu.data);
  if (loading) return <DetailPageSkeleton />;

  const h = hack.data
    ? toHackVM(hack.data, menu.data)
    : fallbackMenu.data
      ? menuItemToHack(fallbackMenu.data)
      : null;
  if (!h)
    return (
      <CenteredShell>
        <StatePanel
          icon="search"
          title="That hack isn't here"
          body={
            hack.error && !fallbackMenu.error
              ? "It may have been removed from the catalogue, or the link may be out of date."
              : hack.error
                ? getErrorMessage(hack.error)
                : "It may have been removed from the catalogue, or the link may be out of date."
          }
          primary={{ label: "Browse Fast Hacks", to: "/fast-hacks" }}
          secondary={{ label: "Go to Home", to: "/home" }}
        />
      </CenteredShell>
    );

  const idx = all.findIndex((x) => x.id === h.id);
  const neighbour = (d: number) => {
    const t = idx < 0 ? undefined : all[idx + d];
    return t ? { to: `/hack/${t.id}`, title: t.title } : undefined;
  };
  const related = relatedItems(
    { ...h, category: h.restaurantId },
    all.map((x) => ({ ...x, category: x.restaurantId })),
    (x) => [...x.goalTags, ...x.tags],
  );
  const isSaved = saved.isSaved("fast_hack", h.id);

  return (
    <>
      <TwoPaneDetail
        listLabel="Fast Hacks"
        listTitle="FAST HACKS"
        activeId={h.id}
        items={all.map((x) => ({
          id: x.id,
          title: x.title,
          subtitle: `${x.restaurant} · ${x.calories} kcal`,
          image: x.image,
          to: `/hack/${x.id}`,
        }))}
      >
        <DetailFrame
          image={h.image}
          badge={h.badge}
          title={h.title}
          subtitle={h.restaurant}
          fallbackRoute="/fast-hacks"
          fit={fitFor(h, budget)}
          prev={neighbour(-1)}
          next={neighbour(1)}
          footer={
            <>
              <SecondaryButton
                label={isSaved ? "Saved" : "Save"}
                onPress={() =>
                  void saved.toggle({
                    itemType: "fast_hack",
                    itemId: h.id,
                    title: h.title,
                    subtitle: h.restaurant,
                  })
                }
              />
              <PrimaryButton
                label="ForkThis!"
                onPress={() =>
                  portion.open({
                    id: h.id,
                    title: h.title,
                    subtitle: h.restaurant,
                    calories: h.calories,
                    protein: h.protein,
                    carbs: h.carbs,
                    fat: h.fat,
                    sourceType: hack.data ? "fast_hack" : "menu_item",
                  })
                }
              />
            </>
          }
        >
          <NutritionLine calories={h.calories} protein={h.protein} carbs={h.carbs} fat={h.fat} />
          {h.orderScript.length > 0 && (
            <CounterScript lines={h.orderScript} restaurant={h.restaurant} />
          )}
          <RestaurantNote />
          {surgery && (
            <SurgeryNote>
              Follow your care team&apos;s guidance on how much to eat, and log the portion you
              actually have.
            </SurgeryNote>
          )}
          {(h.description || h.outcome || h.why) && (
            <DetailSection title="Why it works">
              {h.outcome && <p className="text-onb-body text-text-secondary">{h.outcome}</p>}
              {h.description && <p className="text-onb-body text-text-secondary">{h.description}</p>}
              {h.why && <CheckBullet>{h.why}</CheckBullet>}
            </DetailSection>
          )}
          {h.swaps.length > 0 && (
            <DetailSection title="Smart swaps">
              {h.swaps.map((s) => (
                <DotBullet key={s}>{s}</DotBullet>
              ))}
            </DetailSection>
          )}
          {h.goalTags.length > 0 && (
            <DetailSection title="Goal-aligned benefits">
              {h.goalTags.map((t) => (
                <DotBullet key={t}>{t.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase())}</DotBullet>
              ))}
            </DetailSection>
          )}
          <Disclosure title="Full nutrition" summary="Macro split">
            <MacroDonut
              macros={{ protein: h.protein, carbs: h.carbs, fat: h.fat }}
              total={h.calories}
              variant="detail"
            />
          </Disclosure>
          <MedicalNote />
          {related.length > 0 && (
            <section className="flex flex-col gap-3 border-t border-border-divider pt-5">
              <RelatedHeading>Similar fast hacks</RelatedHeading>
              <div className="flex flex-col gap-2.5">
                {related.map((x) => (
                  <RelatedRow
                    key={x.id}
                    image={x.image}
                    title={x.title}
                    subtitle={x.restaurant}
                    tag={x.badge}
                    to={`/hack/${x.id}`}
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
