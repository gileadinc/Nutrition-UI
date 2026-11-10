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
