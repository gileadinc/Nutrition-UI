import { ALLERGEN, DIETARY_PREFERENCE } from "./constants";

/** Minimal shape needed to reason about a recipe (compatible with `Recipe` from the API). */
export interface DietaryRecipe {
  title: string;
  description?: string;
  ingredients: string[];
  carbs?: number;
  goalTags?: string[];
}

const NUTS = [
  "almond",
  "peanut",
  "cashew",
  "walnut",
  "pecan",
  "pistachio",
  "hazelnut",
  "macadamia",
  "nut",
];

/** Keyword lists used to infer allergens from free-text ingredients. */
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  [ALLERGEN.dairy]: [
    "milk",
    "yogurt",
    "yoghurt",
    "cheese",
    "butter",
    "cream",
    "ghee",
    "parmesan",
    "feta",
    "mozzarella",
    "whey",
  ],
  [ALLERGEN.treeNuts]: NUTS,
  [ALLERGEN.peanuts]: NUTS,
  [ALLERGEN.sesame]: ["sesame", "tahini"],
  [ALLERGEN.fish]: [
    "fish",
    "salmon",
    "tuna",
    "cod",
    "tilapia",
    "halibut",
    "trout",
    "sardine",
    "anchov",
    "mackerel",
    "mahi",
  ],
  [ALLERGEN.corn]: ["corn", "polenta", "masa", "grits", "maize"],
  [ALLERGEN.wheat]: [
    "wheat",
    "bread",
    "pasta",
    "flour",
    "tortilla",
    "wrap",
    "bun",
    "crouton",
    "granola",
    "oat",
    "barley",
    "couscous",
    "noodle",
    "cracker",
  ],
  [ALLERGEN.eggs]: ["egg", "mayo", "mayonnaise", "aioli"],
  [ALLERGEN.soy]: ["soy", "tofu", "edamame", "tempeh", "miso", "tamari", "teriyaki"],
  [ALLERGEN.shellfish]: [
    "shrimp",
    "prawn",
    "crab",
    "lobster",
    "scallop",
    "clam",
    "mussel",
    "oyster",
    "squid",
    "calamari",
  ],
};

const haystack = (r: DietaryRecipe) =>
  [...r.ingredients, r.title, r.description ?? ""].join(" ").toLowerCase();

const hasTag = (r: DietaryRecipe, pattern: RegExp) =>
  (r.goalTags ?? []).some((t) => pattern.test(t));

export const dietaryMatch = {
  /** Allergens (canonical names) that the recipe text suggests it contains. */
  allergensIn(r: DietaryRecipe): string[] {
    const text = haystack(r);
    return Object.entries(ALLERGEN_KEYWORDS)
      .filter(([, words]) => words.some((w) => text.includes(w)))
      .map(([name]) => name);
  },

  /** Which of the user's allergies/avoid-list entries the recipe trips (canonical + free-text). */
  flaggedFor(r: DietaryRecipe, allergies: string[]): string[] {
    const set = new Set(allergies);
    const canonical = dietaryMatch.allergensIn(r).filter((a) => set.has(a));
    const text = haystack(r);
    const custom = allergies.filter(
      (a) =>
        !(a in ALLERGEN_KEYWORDS) && a.trim().length >= 3 && text.includes(a.trim().toLowerCase()),
    );
    return [...canonical, ...custom];
  },

  /** true/false when we can tell, null when the preference isn't checkable. */
  satisfies(r: DietaryRecipe, pref: string): boolean | null {
    const allergens = dietaryMatch.allergensIn(r);
    switch (pref) {
      case DIETARY_PREFERENCE.vegetarian:
      case DIETARY_PREFERENCE.vegan:
        return hasTag(r, /veg/i);
      case DIETARY_PREFERENCE.highProtein:
        return hasTag(r, /protein/i);
      case DIETARY_PREFERENCE.lowCarb:
        return (r.carbs ?? Infinity) <= 30;
      case DIETARY_PREFERENCE.dairyFree:
        return !allergens.includes(ALLERGEN.dairy);
      case DIETARY_PREFERENCE.glutenFree:
        return !allergens.includes(ALLERGEN.wheat);
      default:
        return null;
    }
  },

  /** How many of the user's preferences the recipe satisfies. */
  matchScore(r: DietaryRecipe, prefs: string[]): number {
    return prefs.filter((p) => dietaryMatch.satisfies(r, p) === true).length;
  },
};
