"use client";

import { cn } from "@/lib/utils";
import { Link, useParams } from "@/lib/nav";
import { ProfileLayout } from "@/components/Track/ProfileParts";

const UPDATED = "September 17, 2026";

const DOCS = {
  terms: {
    title: "Terms of service",
    short: "Terms",
    intro: "These terms describe how you may use ForkThis.",
    sections: [
      {
        heading: "What this is",
        body: [
          "ForkThis suggests recipes and restaurant orders and lets you track what you eat. Nutrition figures are estimates.",
        ],
      },
      {
        heading: "Your use",
        body: [
          "Use the app to explore and plan your meals. Don't rely on it for decisions about your health, allergies or diet.",
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
    short: "Privacy",
    intro: "The short version: we keep what you give us to run the app, and you can export or delete it.",
    sections: [
      {
        heading: "What is stored",
        body: [
          "Your profile, saved items and logged meals and water are stored against your account so they follow you across devices.",
        ],
      },
      {
        heading: "Who can see it",
        body: ["Only you, through your account. You choose whether analytics and personalised recommendations are on."],
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
  health: {
    title: "Health disclaimer",
    short: "Health",
    intro: "Please read this before acting on any number the app shows you.",
    sections: [
      {
        heading: "General information only",
        body: ["ForkThis gives general nutrition information. It is not medical advice, diagnosis or treatment."],
      },
      {
        heading: "Estimates, not measurements",
        body: [
          "Calorie and BMI figures are estimates from formulas, not clinical measurements.",
          "BMI does not account for muscle, frame or age, and calorie targets vary from person to person.",
        ],
      },
      {
        heading: "Allergies",
        body: [
          "Allergen flags are based on ingredient names and can miss things. Always check packaging and ask the restaurant.",
        ],
      },
      {
        heading: "Talk to a professional",
        body: [
          "Talk to a qualified clinician before changing your diet, especially around surgery or a medical condition.",
        ],
      },
    ],
  },
};

export function LegalScreen() {
  const { document: doc = "terms" } = useParams<{ document: string }>();
  const key = (doc in DOCS ? doc : "terms") as keyof typeof DOCS;
  const d = DOCS[key];
  return (
    <ProfileLayout title={d.title} subtitle={`Last updated ${UPDATED}`}>
      <nav aria-label="Legal documents" className="flex gap-2">
        {(Object.keys(DOCS) as (keyof typeof DOCS)[]).map((k) => (
          <Link
            key={k}
            to={`/you/legal/${k}`}
            replace
            aria-current={k === key ? "page" : undefined}
            className={cn(
              "flex h-10 items-center rounded-full border px-4 text-[13px] transition-colors",
              k === key
                ? "type-button border-transparent bg-brand-navy text-text-on-dark"
                : "type-button-secondary border-border-default bg-white text-text-secondary hover:border-text-neutral-400",
            )}
          >
            {DOCS[k].short}
          </Link>
        ))}
      </nav>
      <article className="panel mt-4 max-w-prose p-5 md:p-7">
        <p className="text-[15px] leading-6 text-text-primary">{d.intro}</p>
        {d.sections.map((s) => (
          <section key={s.heading} className="mt-6">
            <h2 className="text-[15px] type-section-title tracking-[-0.3px] text-brand-navy">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-2 text-[14px] leading-6 text-text-primary">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </ProfileLayout>
  );
}
