/**
 * App copy and static content. The words live in the sibling `*.json` files so they can be
 * edited (or later swapped for a CMS) without touching UI code; this module only gives them types.
 */
import carouselJson from "./carousel.json";
import guestGateJson from "./guestGate.json";
import helpJson from "./help.json";
import homeJson from "./home.json";
import legalJson from "./legal.json";
import meloJson from "./melo.json";
import nutritionJson from "./nutrition.json";
import questionnaireJson from "./questionnaire.json";
import uiJson from "./ui.json";
import type { IconName } from "@/components/Icon";

/* ----------------------------------------------------------------- shared */

export interface Cta {
  label: string;
  to: string;
}

/** Fills `{name}` placeholders in a copy string. */
export const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);

/* ---------------------------------------------------------------- carousel */

export const CAROUSEL = carouselJson as {
  slides: { image: string; heading: string; body: string }[];
  nextLabel: string;
  lastLabel: string;
};

/* -------------------------------------------------------------- guest gate */

export const GUEST_GATE = guestGateJson as {
  title: { withFeature: string; generic: string };
  fallbackDescription: string;
  fallbackCta: string;
  dismiss: string;
  perks: { icon: IconName; label: string }[];
};

/* -------------------------------------------------------------- help/legal */

export const HELP = helpJson as { faq: { q: string; a: string }[] };

export type LegalKey = "terms" | "privacy" | "health";
export const LEGAL = legalJson as {
  updated: string;
  docs: Record<
    LegalKey,
    { title: string; short: string; intro: string; sections: { heading: string; body: string[] }[] }
  >;
};

/* -------------------------------------------------------------------- home */

export const HOME = homeJson as { tour: { title: string; body: string }[] };

/* -------------------------------------------------------------------- melo */

export type MeloStateTone = "well" | "error" | "muted";
export const MELO_COPY = meloJson as {
  subtitle: string;
  starters: { intent: string; text: string; icon: IconName }[];
  quickPrompts: string[];
  followUps: Record<string, string[]>;
  voiceMessages: Record<"denied" | "no-speech" | "network" | "unavailable", string>;
  states: Record<
    string,
    {
      title: string;
      body: string;
      icon: IconName;
      tone: MeloStateTone;
      primary: Cta;
      secondary?: Cta;
    }
  >;
};

/* --------------------------------------------------------------- nutrition */

export const NUTRITION_COPY = nutritionJson as {
  goalLabel: Record<"lose" | "gain" | "maintain" | "recomp", string>;
  activityLabel: Record<
    "mostlyInactive" | "lightlyActive" | "moderatelyActive" | "veryActive" | "extremelyActive",
    string
  >;
  activityHint: Record<
    "mostlyInactive" | "lightlyActive" | "moderatelyActive" | "veryActive" | "extremelyActive",
    string
  >;
};

/* ------------------------------------------------------------ questionnaire */

export const QUESTIONNAIRE = questionnaireJson as {
  steps: Record<
    "dob" | "goal" | "height" | "weight" | "activity" | "surgery",
    { name: string; eyebrow: string; title: string; why: string; optional: boolean }
  >;
  goalOptions: {
    value: "lose" | "gain" | "maintain" | "recomp";
    title: string;
    subtitle: string;
    icon: IconName;
    image: { src: string; alt: string };
  }[];
  surgeryMeta: Record<string, { subtitle: string; icon: IconName }>;
};

/* --------------------------------------------------------------------- ui */

export const UI = uiJson as {
  location: {
    eyebrow: string;
    title: string;
    body: string;
    allow: string;
    retry: string;
    locating: string;
    denied: string;
    unavailable: string;
    unsupported: string;
    active: string;
  };
};
