"use client";

import { useEffect, useRef, useState } from "react";
import { AppImage, PhotoFade } from "@/components/AppImage";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { OnboardingSplit } from "@/components/Onboarding";
import { Logo } from "@/components/Shell/Logo";
import { useIsLg, useReducedMotion } from "@/lib/hooks";
import { useNavigate } from "@/lib/nav";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image: "/img/onboarding/tour-smart-order-v2",
    heading: "Eat smart, anywhere.",
    body: "Know exactly what to order at your favorite restaurants to stay on track.",
  },
  {
    image: "/img/onboarding/tour-personalized-plan-v2",
    heading: "Personalized to your goal.",
    body: "Your plan adapts to your body, your goal and any surgical context.",
  },
  {
    image: "/img/onboarding/tour-clinical-support-v2",
    heading: "Clinical depth, real empathy.",
    body: "Built by a plastic surgeon and a creator who lost 260 lb. Support, not judgement.",
  },
];
const LAST = SLIDES.length - 1;
const DIST_RATIO = 0.18;
const VELOCITY = 0.5;

export function OnboardingCarousel() {
  const navigate = useNavigate();
  const lg = useIsLg();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [dragX, setDragX] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const drag = useRef<{ x: number; t: number; id: number; active: boolean } | null>(null);
  const slide = SLIDES[index];

  const goTo = (n: number) => {
    const next = Math.max(0, Math.min(LAST, n));
    setDirection(next < index ? "back" : "forward");
    setIndex(next);
    setInteracted(true);
  };
  const finish = () => navigate("/questionnaire");
  const next = () => (index < LAST ? goTo(index + 1) : finish());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setDirection("forward");
        setIndex((i) => Math.min(LAST, i + 1));
        setInteracted(true);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setDirection("back");
        setIndex((i) => Math.max(0, i - 1));
        setInteracted(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    drag.current = { x: e.clientX, t: e.timeStamp, id: e.pointerId, active: false };
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.active && Math.abs(dx) > 8) {
      d.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.active) setDragX((index === 0 && dx > 0) || (index === LAST && dx < 0) ? dx / 3 : dx);
  };
  const onUp = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    const dx = e.clientX - d.x;
    const v = Math.abs(dx) / Math.max(1, e.timeStamp - d.t);
    const w = e.currentTarget.clientWidth || 1;
    setDragX(0);
    if (Math.abs(dx) / w > DIST_RATIO || (v > VELOCITY && Math.abs(dx) > 32)) {
      goTo(index + (dx < 0 ? 1 : -1));
    }
  };

  const nextLabel = index === LAST ? "Let's begin" : "Next";
  const announcer = (
    <p data-testid="tour-announcer" aria-live="polite" aria-atomic="true" className="sr-only">
      {interacted ? `Slide ${index + 1} of ${SLIDES.length}: ${slide.heading}` : ""}
    </p>
  );
  const dots = (
    <div className="-ml-2 flex items-center">
      {SLIDES.map((s, i) => (
        <button
          key={s.image}
          type="button"
          onClick={() => goTo(i)}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === index ? "true" : undefined}
          className="flex h-11 w-7 items-center justify-center"
        >
          <span
            className={cn(
              "block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
              i === index ? "w-5 bg-accent" : "w-1.5 bg-navy-200",
            )}
          />
        </button>
      ))}
    </div>
  );
  const skip = (card: boolean) => (
    <button
      type="button"
      onClick={finish}
      className={cn(
        "h-11 rounded-full px-5 text-onb-body type-button-secondary",
        card ? "bg-surface-card text-brand-navy" : "text-brand-navy hover:bg-navy-soft",
      )}
    >
      Skip
    </button>
  );

  if (lg) {
    return (
      <OnboardingSplit images={SLIDES.map((s) => s.image)} activeImage={index}>
        <main
          aria-roledescription="carousel"
          aria-label="How ForkThis works"
          className="flex min-h-dvh flex-col px-12 py-8 xl:px-20"
        >
          {announcer}
          <header className="mx-auto flex h-11 w-full max-w-[30rem] shrink-0 items-center justify-between">
            <Logo />
            <span className="-mr-5">{skip(false)}</span>
          </header>
          <div
            data-testid="tour-column"
            className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col justify-center py-10"
          >
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${SLIDES.length}`}
              className={cn(
                !reduced && "onb-step-in",
                !reduced && direction === "back" && "onb-step-back",
              )}
            >
              <p className="text-onb-meta type-meta tabular-nums text-text-secondary">
                {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
              </p>
              <h1 className="mt-2 text-onb-display type-display text-brand-navy">
                {slide.heading}
              </h1>
              <p className="mt-3 text-onb-body text-text-secondary">{slide.body}</p>
            </div>
            <div className="mt-10 flex items-center gap-3">
              {index > 0 && (
                <SecondaryButton
                  label="Back"
                  onPress={() => goTo(index - 1)}
                  className="w-32 text-onb-body"
                />
              )}
              <PrimaryButton label={nextLabel} onPress={next} className="w-44" />
              <div className="-mr-2 ml-auto">{dots}</div>
            </div>
          </div>
        </main>
      </OnboardingSplit>
    );
  }

  return (
    <main
      aria-roledescription="carousel"
      aria-label="How ForkThis works"
      className="relative h-dvh touch-pan-y select-none overflow-hidden bg-brand-navy"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {announcer}
      <div
        className={cn(
          "flex h-full",
          dragX === 0 &&
            !reduced &&
            "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
        )}
        style={{ transform: `translateX(calc(${-index * 100}% + ${dragX}px))` }}
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.image}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className="relative h-full w-full shrink-0"
          >
            <AppImage
              src={s.image}
              alt=""
              priority={i === 0}
              sizes="100vw"
              className="pointer-events-none absolute inset-0 size-full object-cover object-[50%_35%]"
            />
            <div className="absolute inset-x-0 bottom-0 flex min-h-[50%] flex-col justify-end px-6 pb-[calc(9.5rem+env(safe-area-inset-bottom))] pt-32">
              <PhotoFade variant="copy" />
              <div className="relative mx-auto w-full max-w-md">
                <h1 className="text-onb-photo type-display text-brand-navy sm:text-onb-photo-sm">
                  {s.heading}
                </h1>
                <p className="mt-3 text-onb-body text-text-secondary">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-md items-center justify-between sm:max-w-none">
          <Logo mark className="pl-2" />
          {skip(true)}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          {dots}
          <div className="flex gap-3">
            {index > 0 && (
              <SecondaryButton
                label="Back"
                onPress={() => goTo(index - 1)}
                className="w-28 shrink-0 border-brand-navy text-onb-body text-brand-navy"
              />
            )}
            <PrimaryButton label={nextLabel} onPress={next} />
          </div>
        </div>
      </div>
    </main>
  );
}
