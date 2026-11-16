export type LegalDocKey = "terms" | "privacy";

export interface LegalDoc {
  title: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
}

export const LEGAL_UPDATED = "September 17, 2026";

export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  terms: {
    title: "Terms of service",
    intro: "These terms describe how you may use ForkThis!.",
    sections: [
      {
        heading: "What this is",
        body: [
          "ForkThis! suggests recipes and restaurant orders and lets you track what you eat. Nutrition figures are estimates.",
        ],
      },
      {
        heading: "Your use",
        body: [
          "Use the app to explore and plan your meals. Don’t rely on it for decisions about your health, allergies or diet.",
        ],
      },
      {
        heading: "Changes",
        body: ["Features, data and these terms may change from time to time."],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro:
      "The short version: we keep what you give us to run the app, and you can export or delete it.",
    sections: [
      {
        heading: "What is stored",
        body: [
          "Your profile, saved items and logged meals and water are stored against your account so they follow you across devices.",
        ],
      },
      {
        heading: "Who can see it",
        body: [
          "Only you, through your account. You choose whether analytics and personalised recommendations are on.",
        ],
      },
      {
        heading: "Removing it",
        body: [
          "You can export your data or delete your account from Help & support.",
          "Deleting your account removes your data permanently.",
        ],
      },
    ],
  },
};

/**
 * Shown as a pop-up after Register, gated on scrolling to the end. Kept separate
 * from the Terms / Privacy documents, which sit behind the "I agree" checkbox.
 */
export const DISCLAIMER: LegalDoc = {
  title: "Before you start",
  intro: "Please read this in full. You'll need to scroll to the end to continue.",
  sections: [
    {
      heading: "ForkThis! is not medical advice",
      body: [
        "ForkThis! is a food and habit-tracking app. Calorie targets, macro splits, BMI and other figures it shows are estimates produced by general-purpose formulas, not a clinical assessment of you.",
        "Nothing in the app diagnoses, treats or prevents any condition. Talk to a doctor or a registered dietitian before making significant changes to how you eat or train.",
      ],
    },
    {
      heading: "Talk to a clinician first if any of these apply",
      body: [
        "You are pregnant or breastfeeding, under 18, or managing a condition such as diabetes, kidney or liver disease, or heart disease.",
        "You have a history of, or are in recovery from, an eating disorder.",
        "You have had bariatric or other surgery, or you take a GLP-1 agonist, peptides or another medication that affects appetite, weight or nutrient absorption. Your needs differ from the general formulas the app uses.",
      ],
    },
    {
      heading: "Nutrition figures are estimates",
      body: [
        "Restaurant and packaged-food values come from published data that changes without notice, and preparation varies between locations. Check labels and allergen information yourself before you eat, every time.",
        "If you have a food allergy or intolerance, treat the app as a starting point and confirm with the restaurant or manufacturer.",
      ],
    },
    {
      heading: "Your responsibility",
      body: [
        "You decide what to eat and how to train. You use ForkThis! at your own risk, and you remain responsible for your own health decisions.",
        "Stop and seek medical advice if you feel unwell, if you are losing or gaining weight faster than you expected, or if the targets the app sets feel wrong for you.",
      ],
    },
  ],
};
