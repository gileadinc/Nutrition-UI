"use client";

import { useMemo } from "react";
import {
  AsideSection,
  CenteredShell,
  CounterScript,
  DetailPage,
  DetailPageSkeleton,
  FooterAction,
  HowItCompares,
  MacroDonut,
  MedicalNote,
  PrimaryButton,
  RelatedHeading,
  RestaurantNote,
  SecondaryButton,
  SimilarCard,
  StatePanel,
  SurgeryNote,
  WhyItWorks,
  relatedItems,
  usePortionSheet,
  useRecoveringFromSurgery,
} from "@/components";
import { getErrorMessage } from "@/lib/api";
import { useParams } from "@/lib/nav";
import { fitFor, fitsToday } from "@/lib/nutrition";
import {
  useDayBudget,
  useFastHack,
  useFastHacks,
  useMenuItem,
  useRestaurant,
  useSaved,
} from "@/lib/store";
import { menuItemToHack, toHackVM } from "./adapt";

export function HackDetailScreen() {
  const { id = "" } = useParams<{ id: string }>();
  const hack = useFastHack(id);
  // Search returns restaurant menu items; fall back to one when the id is not a fast hack.
  const fallbackMenu = useMenuItem(hack.error && !hack.data ? id : null);
  const menu = useMenuItem(
    hack.data && typeof hack.data.menuItemId === "string" ? hack.data.menuItemId : null,
  );
  const list = useFastHacks({ limit: 100 });
  const restaurantId =
    hack.data && typeof hack.data.restaurantId === "string" ? hack.data.restaurantId : null;
  const restaurantInfo = useRestaurant(restaurantId);
  const saved = useSaved();
  const { budget } = useDayBudget();
  const surgery = useRecoveringFromSurgery();
  const portion = usePortionSheet({ context: "fork" });
  const all = useMemo(() => (list.data?.items ?? []).map((h) => toHackVM(h)), [list.data]);

  const loading =
    (hack.isLoading && !hack.data) ||
    (!!hack.error && fallbackMenu.isLoading && !fallbackMenu.data);
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

  const related = relatedItems(
    { ...h, category: h.restaurantId },
    all.map((x) => ({ ...x, category: x.restaurantId })),
    (x) => [...x.goalTags, ...x.tags],
  );
  const isSaved = saved.isSaved("fast_hack", h.id);
  const humanGoal = (t: string) => t.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
  const firstSentence = (text: string) => {
    const end = text.search(/[.!?](\s|$)/);
    return end === -1 ? text : text.slice(0, end + 1);
  };
  // The API has no "usual order" to compare against, so use real averages: first the
  // restaurant's other menu items, then the other fast hacks that have nutrition data.
  const avg = (rows: { calories: number; protein: number }[]) => ({
    calories: Math.round(rows.reduce((t, r) => t + r.calories, 0) / rows.length),
    protein: Math.round(rows.reduce((t, r) => t + r.protein, 0) / rows.length),
  });
  const menuOthers = (restaurantInfo.data?.menuItems ?? []).filter(
    (m) => m.id !== h.menuItemId && m.calories > 0,
  );
  const hackOthers = all.filter((x) => x.id !== h.id && x.calories > 0);
  const baseline =
    menuOthers.length > 0
      ? {
          ...avg(menuOthers),
          name: `Average ${h.restaurant} menu item`,
          tag: "Menu average",
          intro: `Your order against the average item on the ${h.restaurant} menu.`,
        }
      : hackOthers.length > 0
        ? {
            ...avg(hackOthers),
            name: "Average fast hack",
            tag: "Average",
            intro: `Your order against the average of ${hackOthers.length} other fast hacks.`,
          }
        : null;
  const intro = h.swaps.length > 0 ? h.swaps.join(" · ") : h.outcome || h.description;

  return (
    <>
      <DetailPage
        image={h.image}
        badge={h.badge || undefined}
        title={h.title}
        subtitle={h.restaurant || undefined}
        lede={firstSentence(h.description) || undefined}
        stats={[
          { value: String(h.calories), unit: "kcal", label: "Calories" },
          { value: String(h.protein), unit: "g", label: "Protein" },
          { value: String(h.carbs), unit: "g", label: "Carbs" },
        ]}
        backLabel="Fast Hacks"
        fallbackRoute="/fast-hacks"
        fit={fitFor(h, budget)}
        meta={h.distanceMi !== null ? [{ icon: "location", label: `${h.distanceMi} mi away` }] : []}
        aside={
          <>
            <AsideSection title="Where the calories come from">
              <MacroDonut
                macros={{ protein: h.protein, carbs: h.carbs, fat: h.fat }}
                total={h.calories}
                variant="detail"
              />
            </AsideSection>
            {baseline && h.calories > 0 && (
              <HowItCompares
                intro={baseline.intro}
                baselineTag={baseline.tag}
                yours={{ name: h.title, calories: h.calories, protein: h.protein }}
                baseline={baseline}
              />
            )}
          </>
        }
        footer={
          <>
            <FooterAction caption={isSaved ? "In My Profile · Saved" : "Keep it for later"}>
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
            </FooterAction>
            <FooterAction caption="Add it to today's log">
              <PrimaryButton
                label="LogThis!"
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
            </FooterAction>
          </>
        }
      >
        {h.orderScript.length > 0 && (
          <CounterScript lines={h.orderScript} restaurant={h.restaurant} />
        )}
        {surgery && (
          <SurgeryNote>
            Follow your care team&apos;s guidance on how much to eat, and log the portion you
            actually have.
          </SurgeryNote>
        )}
        <RestaurantNote />
        {(intro || h.why || h.goalTags.length > 0) && (
          <WhyItWorks
            intro={intro}
            build={h.why ? [h.why] : []}
            benefits={h.goalTags.map(humanGoal)}
          />
        )}
        <MedicalNote />
        {related.length > 0 && (
          <section className="flex flex-col gap-3 border-t border-border-divider pt-5">
            <RelatedHeading>Similar fast hacks</RelatedHeading>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
              {related.map((x) => (
                <SimilarCard
                  key={x.id}
                  image={x.image}
                  title={x.title}
                  subtitle={x.restaurant}
                  calories={x.calories}
                  protein={x.protein}
                  tag={x.badge}
                  fits={fitsToday(fitFor(x, budget))}
                  to={`/hack/${x.id}`}
                />
              ))}
            </div>
          </section>
        )}
      </DetailPage>
      {portion.sheet}
    </>
  );
}
