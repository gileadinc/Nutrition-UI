/**
 * Melo's answer engine. Melo is NOT an LLM: this is a rule-based engine (ported from the deployed
 * build) that reads the user's day (budget + tracked days) and the real catalogue (fast hacks and
 * recipes from the API). Pure functions, no I/O.
 */

import { MELO_COPY } from "@/content";
import { fitFor, type Budget } from "@/lib/nutrition";
import { dayCalories, dayProtein, dayWaterOz, type TrackDay } from "@/lib/track";

/* ------------------------------------------------------------------ types */

export interface MeloItem {
  kind: "hack" | "recipe";
  id: string;
  title: string;
  /** Restaurant name (hacks) or "" (recipes). */
  restaurant: string;
  description: string;
  image: string;
  to: string;
  calories: number;
  protein: number;
  /** 0 = unknown. */
  minutes: number;
  tags: string[];
  ingredients: string[];
  /** Card meta line. */
  subtitle: string;
}

export interface MeloContext {
  budget: Budget;
  /** Last 7 days, oldest first (see `useTrackDays`). */
  days: TrackDay[];
  catalog: MeloItem[];
}

export interface MeloCard {
  title: string;
  subtitle: string;
  image: string;
  calories: number;
  protein: number;
  fits: boolean;
}

export interface MeloLink {
  label: string;
  to: string;
  /** Present when the link is a catalogue item (rendered as a dish card). */
  card?: MeloCard;
}

export type MeloRule =
  | "dish"
  | "fits"
  | "fits-over"
  | "fits-none"
  | "progress"
  | "progress-empty"
  | "protein"
  | "water"
  | "search"
  | "swap"
  | "fallback";

export interface MeloReply {
  rule: MeloRule;
  text: string;
  links: MeloLink[];
}

/* ------------------------------------------------------------ query parse */

const DIETS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  veggie: "Veggie",
  keto: "Keto",
  "low carb": "Low carb",
  "gluten free": "Gluten-free",
  "gluten-free": "Gluten-free",
};

const STOP = new Set(
  "a.an.the.i.me.my.can.that.for.with.and.or.something.anything.to.in.on.of.is.it.want.need.give.show.find.get.eat.grab.have.today.tonight.calories.calorie.kcal.protein.minutes.minute.min.mins.under.over.less.than.high.low.quick.fast".split(
    ".",
  ),
);

export interface ParsedQuery {
  terms: string[];
  diets: string[];
  constraintsOnly: boolean;
  maxCalories?: number;
  minProtein?: number;
  maxMinutes?: number;
}

export function parseQuery(input: string): ParsedQuery {
  const t = input.toLowerCase().trim();
  const q: ParsedQuery = { terms: [], diets: [], constraintsOnly: false };
  const cal = /(?:under|below|less than|<)\s*(\d{2,4})\s*(?:kcal|calories|cals?)?/.exec(t);
  if (cal) q.maxCalories = Number(cal[1]);
  const prot = /(\d{1,3})\s*g(?:rams)?\s*(?:of\s*)?protein/.exec(t);
  if (prot) q.minProtein = Number(prot[1]);
  else if (/high[- ]protein|more protein|protein goal/.test(t)) q.minProtein = 25;
  const min = /(?:under|in|within|less than|<)\s*(\d{1,3})\s*(?:min|mins|minutes)/.exec(t);
  if (min) q.maxMinutes = Number(min[1]);
  else if (/\bquick\b|\bfast\b|\bin a hurry\b/.test(t)) q.maxMinutes = 20;
  for (const [key, label] of Object.entries(DIETS)) if (t.includes(key)) q.diets.push(label);
  q.terms = t
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
    .filter((w) => !Object.keys(DIETS).some((k) => k.includes(w)));
  q.constraintsOnly =
    q.terms.length === 0 &&
    (q.maxCalories !== undefined ||
      q.minProtein !== undefined ||
      q.maxMinutes !== undefined ||
      q.diets.length > 0);
  return q;
}

/* ---------------------------------------------------------------- matching */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Every term must hit some field; score = sum of the best field weight per term. */
function matchTerms(terms: string[], fields: { text: string; weight: number }[]) {
  let score = 0;
  for (const term of terms) {
    let best = 0;
    for (const f of fields) {
      if (f.text.toLowerCase().includes(term) && f.weight > best) best = f.weight;
    }
    if (best === 0) return null;
    score += best;
  }
  return score;
}

function meetsConstraints(
  item: Pick<MeloItem, "calories" | "protein" | "minutes" | "tags">,
  q: ParsedQuery,
): boolean {
  if (q.maxCalories !== undefined && item.calories > q.maxCalories) return false;
  if (q.minProtein !== undefined && item.protein < q.minProtein) return false;
  if (q.maxMinutes !== undefined && (item.minutes === 0 || item.minutes > q.maxMinutes)) return false;
  for (const diet of q.diets) {
    if (!item.tags.some((t) => norm(t) === norm(diet))) return false;
  }
  return true;
}

interface Scored {
  item: MeloItem;
  score: number;
}

function scoreItem(item: MeloItem, q: ParsedQuery): Scored | null {
  if (!meetsConstraints(item, q)) return null;
  const fields =
    item.kind === "hack"
      ? [
          { text: item.title, weight: 6 },
          { text: item.restaurant, weight: 5 },
          { text: item.tags.join(" "), weight: 3 },
          { text: item.description, weight: 1 },
        ]
      : [
          { text: item.title, weight: 6 },
          { text: item.ingredients.join(" "), weight: 4 },
          { text: item.tags.join(" "), weight: 3 },
          { text: item.description, weight: 1 },
        ];
  const m = matchTerms(q.terms, fields);
  if (m === null) return null;
  const tie = item.kind === "recipe" ? (100 - item.minutes) / 100 : 0;
  return { item, score: m * 10 + tie };
}

export interface SearchResult {
  hacks: MeloItem[];
  recipes: MeloItem[];
  query: ParsedQuery;
}

export function searchCatalog(
  catalog: MeloItem[],
  input: string,
  scope: "all" | "hacks" | "recipes" = "all",
): SearchResult {
  const query = parseQuery(input);
  if (!(query.terms.length > 0 || query.constraintsOnly)) return { hacks: [], recipes: [], query };
  const pick = (kind: MeloItem["kind"]) =>
    catalog
      .filter((i) => i.kind === kind)
      .map((i) => scoreItem(i, query))
      .filter((s): s is Scored => s !== null)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.item);
  return {
    hacks: scope === "recipes" ? [] : pick("hack"),
    recipes: scope === "hacks" ? [] : pick("recipe"),
    query,
  };
}

/** When a query finds nothing, the first constraint that can be dropped to get results. */
export function relaxQuery(
  catalog: MeloItem[],
  input: string,
  scope: "all" | "hacks" | "recipes" = "all",
): { label: string; query: string } | null {
  const q = parseQuery(input);
  const tries: { label: string; rewrite: string }[] = [];
  if (q.maxCalories !== undefined)
    tries.push({
      label: `without the ${q.maxCalories} kcal limit`,
      rewrite: input.replace(/(?:under|below|less than|<)\s*\d{2,4}\s*(?:kcal|calories|cals?)?/i, "").trim(),
    });
  if (q.minProtein !== undefined)
    tries.push({
      label: "without the protein floor",
      rewrite: input.replace(/high[- ]protein|\d{1,3}\s*g(?:rams)?\s*(?:of\s*)?protein/i, "").trim(),
    });
  if (q.maxMinutes !== undefined)
    tries.push({
      label: "without the time limit",
      rewrite: input.replace(/(?:under|in|within|less than|<)\s*\d{1,3}\s*(?:min|mins|minutes)/i, "").trim(),
    });
  if (q.diets.length > 0)
    tries.push({
      label: `without "${q.diets[0]}"`,
      rewrite: input.replace(new RegExp(q.diets[0], "i"), "").trim(),
    });
  for (const t of tries) {
    const r = searchCatalog(catalog, t.rewrite, scope);
    if (r.hacks.length + r.recipes.length > 0) return { label: t.label, query: t.rewrite };
  }
  return null;
}

/* ------------------------------------------------------------------ answers */

const kcal = (n: number) => `${Math.round(n).toLocaleString("en-US")} kcal`;
const list = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

const LIGHTEST: MeloLink = { label: "See the lightest options", to: "/fast-hacks?sort=calories" };

function cardOf(item: MeloItem, budget: Budget): MeloLink {
  return {
    label: item.title,
    to: item.to,
    card: {
      title: item.title,
      subtitle: item.subtitle,
      image: item.image,
      calories: item.calories,
      protein: item.protein,
      fits: fitFor(item, budget).kind !== "over",
    },
  };
}

export function answer(input: string, ctx: MeloContext): MeloReply {
  const n = input.toLowerCase();
  const { budget, days, catalog } = ctx;
  const had = `${Math.round(budget.calories.consumed).toLocaleString("en-US")} of ${Math.round(budget.calories.goal).toLocaleString("en-US")}`;

  // 1. a named dish
  const dish = catalog
    .filter((i) => i.title && n.includes(i.title.toLowerCase()))
    .sort((a, b) => b.title.length - a.title.length)[0];
  if (dish) {
    const fits = fitFor(dish, budget).kind !== "over";
    const from = dish.kind === "hack" && dish.restaurant ? ` from ${dish.restaurant}` : "";
    return {
      rule: "dish",
      text: `${dish.title}${from} has ${kcal(dish.calories)} and ${dish.protein}g protein${fits ? ", and it fits the rest of your day" : ""}. ${
        dish.kind === "hack"
          ? "Dressing and sauces on the side are the easiest way to adjust it."
          : "A smaller portion with an extra side of vegetables is the easiest way to adjust it."
      }`,
      links: [cardOf(dish, budget)],
    };
  }

  // 2. what fits
  if (/fits?|what (can|should) i (eat|order|have)|remaining|left today|budget|rest of (my|the) day/.test(n)) {
    if (budget.calories.over > 0)
      return {
        rule: "fits-over",
        text: `You've had ${kcal(budget.calories.consumed)} today, with a goal of ${kcal(budget.calories.goal)}. If you're still hungry, the lightest options are a good place to start.`,
        links: [LIGHTEST],
      };
    const r = searchCatalog(catalog, `under ${budget.calories.remaining} calories`);
    const top = [...r.hacks, ...r.recipes].sort((a, b) => b.protein - a.protein).slice(0, 3);
    if (top.length === 0)
      return {
        rule: "fits-none",
        text: `You've had ${had} today. Nothing in the catalogue fits the rest of today, so the lightest options are a good place to start.`,
        links: [LIGHTEST],
      };
    return {
      rule: "fits",
      text: `You've had ${had} today. ${list(top.map((i) => i.title))} ${top.length === 1 ? "fits" : "all fit"} the rest of your day, highest protein first.`,
      links: [...top.map((i) => cardOf(i, budget)), { label: "Everything that fits", to: "/fast-hacks?fits=1" }],
    };
  }

  // 3. weekly progress
  if (/how am i|how('s| is) (my|today|this week)|doing|progress|on track/.test(n)) {
    const logged = days.filter((d) => d.meals.length > 0 || d.hydration.length > 0);
    if (logged.length === 0)
      return {
        rule: "progress-empty",
        text: "Nothing is logged this week yet. Log a meal or a glass of water and I can read the week back to you.",
        links: [{ label: "Log a meal", to: "/track/log-meal" }],
      };
    const proteinDays = logged.filter((d) => dayProtein(d) >= d.proteinGoal).length;
    const waterDays = logged.filter((d) => dayWaterOz(d) >= d.waterGoalOz).length;
    const withMeals = logged.filter((d) => d.meals.length > 0);
    const calDays = withMeals.filter((d) => dayCalories(d) <= d.calorieGoal).length;
    const total = logged.length;
    const calText =
      withMeals.length === 0
        ? ""
        : `, and calories stayed within your goal on ${calDays}${
            withMeals.length === total
              ? ""
              : ` of the ${withMeals.length} ${withMeals.length === 1 ? "day" : "days"} with meals`
          }`;
    return {
      rule: "progress",
      text: `You logged ${total} of the last ${days.length} days. Protein reached its goal on ${proteinDays} of ${total === 1 ? "it" : "them"}, water on ${waterDays}${calText}.`,
      links: [
        ...(proteinDays < total / 2 ? [{ label: "High-protein options", to: "/fast-hacks?protein=30" }] : []),
        { label: "See the full week", to: "/track/insights" },
      ],
    };
  }

  // 4. protein
  if (/protein/.test(n)) {
    const r = searchCatalog(catalog, "high protein");
    const top = [...r.hacks, ...r.recipes].sort((a, b) => b.protein - a.protein).slice(0, 2);
    return {
      rule: "protein",
      text:
        budget.protein.consumed < budget.protein.goal
          ? `You've had ${budget.protein.consumed} of ${budget.protein.goal}g protein today.${
              top.length ? ` ${list(top.map((i) => `${i.title} has ${i.protein}g`))}.` : ""
            }`
          : `You've reached today's ${budget.protein.goal}g protein goal.`,
      links: [...top.map((i) => cardOf(i, budget)), { label: "High-protein options", to: "/fast-hacks?protein=30" }],
    };
  }

  // 5. water
  if (/water|hydrat|drink/.test(n))
    return {
      rule: "water",
      text:
        budget.water.consumed < budget.water.goal
          ? `You've had ${budget.water.consumed} of ${budget.water.goal} oz of water today.`
          : `You've reached today's ${budget.water.goal} oz of water.`,
      links: [{ label: "Log water", to: "/track/water" }],
    };

  // 6. catalogue search
  const s = searchCatalog(catalog, input);
  const found = [...s.hacks, ...s.recipes];
  if (found.length > 0) {
    const top = found.slice(0, 3);
    return {
      rule: "search",
      text: `${found.length === 1 ? "Here's what I found" : `I found ${found.length}`}: ${list(top.map((i) => `${i.title} (${i.calories} kcal)`))}.`,
      links: top.map((i) => cardOf(i, budget)),
    };
  }

  // 7. swaps
  if (/swap|substitut|instead of|alternative/.test(n))
    return {
      rule: "swap",
      text: "Greek yogurt for sour cream, grilled for crispy, dressing on the side: three easy swaps that change a restaurant order the most for the least effort.",
      links: [{ label: "Options that fit today", to: "/fast-hacks?fits=1" }],
    };

  // 8. fallback
  return {
    rule: "fallback",
    text: "I can help with what fits your day, how your week is going, your protein and water, and anything in the catalogue. I couldn't match that one to a dish or a number, so try naming a dish or a restaurant.",
    links: [
      { label: "What fits today", to: "/fast-hacks?fits=1" },
      { label: "This week", to: "/track/insights" },
    ],
  };
}

/* ------------------------------------------------------------------ prompts */

export const STARTERS = MELO_COPY.starters;

export const QUICK_PROMPTS = MELO_COPY.quickPrompts;

const FOLLOW_UPS: Record<string, string[]> = MELO_COPY.followUps;

export const followUps = (rule: MeloRule) => FOLLOW_UPS[rule] ?? FOLLOW_UPS.fallback;
