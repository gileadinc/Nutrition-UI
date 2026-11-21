"use client";

import type { ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { PrimaryButton } from "@/components/Button";
import { useNavigate } from "@/lib/nav";

const ONB = "/img/figma-2026-11/onboarding";

const PAGES = [
  {
    image: `${ONB}/intro-cook-v3`,
    heading: "CookThis!",
    body: "From meal-preps to family dinners, find low calorie, high protein recipes that work for your real life.",
  },
  {
    image: `${ONB}/intro-hack-v3`,
    heading: "HackThis!",
    body: "Restaurant hacks that allow you to eat healthier at the places you already love!",
  },
  {
    image: `${ONB}/intro-track-v3`,
    heading: "TrackThis!",
    body: "ForkThis! allows you to customize your profile around your goals and move at your own pace by tracking meals, movement, and the habits that matter most to you!",
  },
];

const STEPS = ["01 · Your goals", "02 · Your routine", "03 · Your plan"];

function Tile({
  page,
  className,
  focus = "",
  children,
}: {
  page: (typeof PAGES)[number];
  className: string;
  focus?: string;
  children: ReactNode;
}) {
  return (
    <article className={`relative min-w-0 overflow-hidden ${className}`}>
      <AppImage
        src={page.image}
        alt=""
        priority
        sizes="(min-width: 1024px) 340px, 100vw"
        className={`absolute inset-0 size-full object-cover ${focus}`}
      />
      {children}
    </article>
  );
}

/** Pre-quiz intro: three feature tiles beside the "A plan that fits your real life" pitch. */
export function OnboardingCarousel() {
  const navigate = useNavigate();
  const [cook, hack, track] = PAGES;
  return (
    <main className="min-h-dvh bg-auth-canvas p-4">
      <div className="mx-auto grid max-w-[1800px] gap-4 lg:min-h-[calc(100dvh-2rem)] lg:grid-cols-[minmax(0,677px)_minmax(0,1fr)]">
        <section
          aria-label="What you can do with ForkThis"
          className="order-last flex min-w-0 flex-col gap-4 lg:order-first"
        >
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            {[cook, hack].map((p) => (
              <Tile
                key={p.heading}
                page={p}
                className="min-h-[26rem] rounded-[17px] bg-brand-cream"
              >
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-cream via-brand-cream/90 to-transparent px-[17px] pb-4 pt-14 text-primary">
                  <h2 className="text-[32px] type-section-title leading-none tracking-[-0.6px]">
                    {p.heading}
                  </h2>
                  <p className="mt-1 min-h-[3.75rem] max-w-[16.5rem] text-sm type-extra-light leading-5 tracking-[-0.176px] text-text-primary">
                    {p.body}
                  </p>
                </div>
              </Tile>
            ))}
          </div>
          <Tile page={track} className="h-[418px] shrink-0 rounded-2xl" focus="object-[28%_center]">
            <div className="absolute inset-y-0 right-4 flex w-[min(331px,55%)] flex-col justify-center">
              <h2 className="text-[32px] type-section-title leading-none tracking-[-0.6px] text-text-primary">
                {track.heading}
              </h2>
              <p className="mt-1 text-sm type-extra-light leading-5 tracking-[-0.176px] text-text-primary">
                {track.body}
              </p>
            </div>
          </Tile>
        </section>
        <section
          aria-labelledby="quiz-intro-heading"
          className="page-settle flex min-w-0 flex-col justify-end px-2 pb-8 pt-6 text-primary lg:px-[30px] lg:pb-9"
        >
          <div className="max-w-[576px]">
            <h1
              id="quiz-intro-heading"
              className="max-w-[486px] text-[clamp(3rem,5.2vw,4.75rem)] type-section-title leading-[1.03] tracking-[-0.079em]"
            >
              A plan that fits your real life.
            </h1>
            <p className="mt-6 text-sm leading-5 tracking-[-0.02em] text-text-secondary">
              Tell us a little about your goals. We’ll turn your answers into a simple starting plan
              for meals, movement, and the days in between.
            </p>
            <p className="mt-8 text-xs capitalize leading-4 tracking-[1.2px] text-text-primary">
              Your next two minutes
            </p>
            <ul className="flex flex-wrap gap-2 pt-3">
              {STEPS.map((s) => (
                <li
                  key={s}
                  className="rounded-full px-3 py-2 text-xs type-extra-light leading-4 tracking-[-0.176px] text-text-primary"
                >
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <PrimaryButton
                label="Start your quiz"
                onPress={() => navigate("/questionnaire?step=dob")}
                className="w-full !rounded-[52px] motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
              />
            </div>
            <p className="mt-3 text-sm type-extra-light tracking-[-0.176px] text-text-secondary">
              Free to start · No account needed
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
