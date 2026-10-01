"use client";

import { useEffect, useRef, useState } from "react";
import {
  CenteredShell,
  DetailPageSkeleton,
  Icon,
  PageContainer,
  PrimaryButton,
  SecondaryButton,
  StatePanel,
  usePortionSheet,
} from "@/components";
import { CONTROL_ON, PRIMARY_DISABLED } from "@/components/styles";
import { getErrorMessage } from "@/lib/api";
import { useNavigate, useParams } from "@/lib/nav";
import { toast, useRecipe } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toRecipeVM, type RecipeVM } from "./adapt";

/** Seconds mentioned in a step ("simmer 10 minutes"), or null. */
function timerSeconds(text: string): number | null {
  const t = text.toLowerCase();
  const h = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/.exec(t);
  const m = /(\d+)(?:\s*[-–]\s*\d+)?\s*(?:minutes?|mins?|m)\b/.exec(t);
  const s = /(\d+)\s*(?:seconds?|secs?|s)\b/.exec(t);
  let total = 0;
  if (h) total += Math.round(Number(h[1]) * 3600);
  if (m) total += Number(m[1]) * 60;
  if (s && !m && !h) total += Number(s[1]);
  return total <= 0 || total > 14400 ? null : total;
}

/** Ingredients whose significant words appear in the step text. */
function stepIngredients(step: string, ingredients: string[]) {
  const t = step.toLowerCase();
  return ingredients.filter((ing) =>
    ing
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .some((w) => t.includes(w)),
  );
}

function useCookRecipe(): { recipe: RecipeVM | null; loading: boolean; node: React.ReactNode } {
  const { id = "" } = useParams<{ id: string }>();
  const { data, error, isLoading } = useRecipe(id);
  if (isLoading && !data) return { recipe: null, loading: true, node: <DetailPageSkeleton /> };
  if (!data)
    return {
      recipe: null,
      loading: false,
      node: (
        <CenteredShell>
          <StatePanel
            icon="search"
            title="That recipe isn't here"
            body={
              error
                ? getErrorMessage(error)
                : "It may have been removed from the catalogue, or the link may be out of date."
            }
            primary={{ label: "Browse recipes", to: "/recipes" }}
            secondary={{ label: "Go to Home", to: "/home" }}
          />
        </CenteredShell>
      ),
    };
  return { recipe: toRecipeVM(data), loading: false, node: null };
}

export function IngredientsChecklistScreen() {
  const navigate = useNavigate();
  const { recipe: r, node } = useCookRecipe();
  const [have, setHave] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  if (!r) return <>{node}</>;
  const toggle = (i: number) =>
    setHave((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  return (
    <PageContainer variant="focused" pathname={`/recipes/${r.id}/ingredients`}>
      <div className="pb-24 md:pb-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
          >
            <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
          </button>
          <h1 className="min-w-0 flex-1 pl-1 text-2xl type-display tracking-[-1.08px] text-brand-navy">
            Ingredients
          </h1>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(r.ingredients.join("\n"));
                setCopied(true);
                toast.success("Ingredients copied", {
                  body: `${r.ingredients.length} lines on the clipboard.`,
                });
              } catch {
                setCopied(false);
              }
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-onb-meta type-button text-primary"
          >
            <Icon name="copy" size={16} color="var(--color-primary)" />
            Copy
          </button>
        </div>
        {copied && (
          <p role="status" className="mt-2 text-center text-onb-meta type-meta text-text-secondary">
            Ingredients copied.
          </p>
        )}
        <p className="mt-5 text-onb-meta type-meta text-text-secondary">{r.title}</p>
        <ul className="mt-2 border-y border-border-divider">
          {r.ingredients.map((ing, i) => {
            const on = have.includes(i);
            return (
              <li key={`${i}-${ing}`} className="border-b border-border-divider last:border-b-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(i)}
                  className="flex min-h-12 w-full items-center gap-3 py-3 text-left"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border",
                      on ? CONTROL_ON : "border-border-default",
                    )}
                  >
                    {on && <Icon name="tick" size={13} color="var(--color-on-primary)" />}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 text-onb-body type-item-title",
                      on ? "text-text-neutral-400 line-through" : "text-text-primary",
                    )}
                  >
                    {ing}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-onb-meta type-meta text-text-secondary">
          {have.length} of {r.ingredients.length} ready
        </p>
        <div className="fixed inset-x-0 bottom-[60px] border-t border-border-divider bg-white px-5 py-3 md:static md:mt-6 md:border-0 md:bg-transparent md:px-0 md:py-0">
          <div className="mx-auto w-full md:ml-0 md:max-w-sm">
            <PrimaryButton label="Start cooking" onPress={() => navigate(`/recipes/${r.id}/cook`)} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function StepTimer({ stepText, stepIndex }: { stepText: string; stepIndex: number }) {
  const suggested = timerSeconds(stepText);
  const [left, setLeft] = useState(suggested ?? 0);
  const [running, setRunning] = useState(false);
  const [seenIndex, setSeenIndex] = useState(stepIndex);
  const timer = useRef<number | null>(null);
  if (seenIndex !== stepIndex) {
    setSeenIndex(stepIndex);
    setLeft(suggested ?? 0);
    setRunning(false);
  }
  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          toast.success("Timer done", { body: stepText, duration: 0 });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, [running, stepText]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <section aria-label="Step timer" className="border-t border-border-divider pt-5">
      <div className="flex items-center gap-3">
        <Icon name="timer" size={18} color="var(--color-primary)" />
        <span className="min-w-0 flex-1 text-onb-meta type-item-title text-text-primary">
          Step timer
          {suggested !== null && (
            <span className="ml-1.5 text-text-secondary">· from this step</span>
          )}
        </span>
        <span
          role="timer"
          aria-label="Time remaining"
          className="text-2xl type-numeral tabular-nums text-brand-navy"
        >
          {mm}:{ss}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 5, 10].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setLeft((t) => t + m * 60)}
            className="min-h-11 rounded-full border border-border-default px-4 text-onb-meta type-button-secondary text-text-primary"
          >
            +{m} min
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          disabled={left === 0}
          className={`flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-onb-meta type-button text-white ${PRIMARY_DISABLED}`}
        >
          <Icon name={running ? "pause" : "play"} size={13} color="currentColor" />
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setLeft(0);
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-border-default px-4 text-onb-meta type-button-secondary text-text-primary"
        >
          <Icon name="refresh" size={13} color="var(--color-text-secondary)" />
          Reset
        </button>
      </div>
    </section>
  );
}

export function CookingModeScreen() {
  const navigate = useNavigate();
  const { recipe: r, node } = useCookRecipe();
  const [step, setStep] = useState(0);
  const count = r?.steps.length ?? 0;
  useEffect(() => {
    if (count === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") setStep((s) => Math.min(count - 1, s + 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [count]);
  if (!r) return <>{node}</>;
  if (r.steps.length === 0)
    return (
      <CenteredShell>
        <StatePanel
          icon="info"
          title="No steps yet"
          body="This recipe doesn't have a method to follow."
          primary={{ label: "Back to recipe", to: `/recipes/${r.id}` }}
        />
      </CenteredShell>
    );
  const steps = r.steps;
  const last = step === steps.length - 1;
  const mine = stepIngredients(steps[step], r.ingredients);
  return (
    <PageContainer variant="focused" pathname={`/recipes/${r.id}/cook`}>
      <div>
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => navigate(`/recipes/${r.id}`)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
          >
            <Icon name="close" size={18} color="var(--color-text-primary)" />
          </button>
          <p className="min-w-0 flex-1 truncate pl-3 text-onb-meta type-item-title text-text-secondary">
            {r.title}
          </p>
        </div>
        <div className="mt-5 flex items-start gap-[22px]">
          <div
            className="flex shrink-0 flex-col items-center gap-1 pt-1"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label={`Step ${step + 1} of ${steps.length}`}
          >
            {steps.map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-progress motion-safe:transition-[height,opacity] motion-safe:duration-200"
                style={{ height: i === step ? 20 : 16, opacity: i <= step ? 1 : 0.18 }}
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="onb-eyebrow">Step {String(step + 1).padStart(2, "0")}</p>
            <h1 className="mt-3 text-2xl type-display leading-[1.25] tracking-[-1.08px] text-brand-navy">
              {steps[step]}
            </h1>
          </div>
        </div>
        {r.ingredients.length > 0 && (
          <>
            <h2 className="mt-8 border-t border-border-divider pt-5 text-onb-body type-section-title text-brand-navy">
              Ingredients
              {mine.length > 0 && (
                <span className="ml-2 text-onb-meta type-meta text-text-secondary">
                  {mine.length} for this step
                </span>
              )}
            </h2>
            <ul className="rail-scroll -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
              {[...mine, ...r.ingredients.filter((i) => !mine.includes(i))].map((ing, i) => {
                const on = mine.length === 0 || mine.includes(ing);
                return (
                  <li
                    key={`${i}-${ing}`}
                    className={cn(
                      "flex h-20 w-[171px] shrink-0 items-center gap-2 rounded-[14px] px-3 py-2.5",
                      mine.length === 0
                        ? "bg-navy-50"
                        : on
                          ? "bg-primary-soft"
                          : "bg-navy-50 opacity-60",
                    )}
                  >
                    {mine.length > 0 && on && (
                      <Icon name="tick" size={14} color="var(--color-primary)" />
                    )}
                    <span
                      className={cn(
                        "line-clamp-3 text-onb-meta type-item-title",
                        on ? "text-text-primary" : "text-text-secondary",
                      )}
                    >
                      {ing}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {!last && (
          <p className="mt-6 hidden text-center text-onb-meta type-meta text-text-secondary md:block">
            Arrow keys move between steps
          </p>
        )}
        <div className="mt-6">
          <StepTimer stepText={steps[step]} stepIndex={step} />
        </div>
        <div className="mt-6 border-t border-border-divider bg-white py-3 md:border-0 md:bg-transparent md:py-0">
          <div className="flex w-full gap-3 md:max-w-md md:justify-start">
            <SecondaryButton
              label="Back"
              className="text-onb-body"
              onPress={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            />
            <PrimaryButton
              label={last ? "Finish" : "Next step"}
              onPress={() =>
                last
                  ? navigate(`/recipes/${r.id}/cook/complete`)
                  : setStep((s) => Math.min(steps.length - 1, s + 1))
              }
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export function CookingCompleteScreen() {
  const navigate = useNavigate();
  const portion = usePortionSheet({ context: "cook" });
  const { recipe: r, node } = useCookRecipe();
  if (!r) return <>{node}</>;
  return (
    <PageContainer variant="focused" pathname={`/recipes/${r.id}/cook/complete`}>
      <div className="mx-auto flex w-full max-w-md flex-col items-center py-2 text-center md:py-8">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-teal-soft">
          <Icon name="checkCircle" size={32} color="var(--color-status-good)" />
        </span>
        <h1 className="mt-6 text-onb-chapter type-display text-brand-navy">Nice work</h1>
        <p className="mt-2 text-onb-body text-text-secondary">
          You cooked {r.title}. Log it so today&apos;s numbers stay honest.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3">
          <PrimaryButton
            label="Log this meal"
            onPress={() =>
              portion.open({
                id: r.id,
                title: r.title,
                subtitle: r.time,
                calories: r.calories,
                protein: r.protein,
                carbs: r.carbs,
                fat: r.fat,
                sourceType: "recipe",
              })
            }
          />
          <SecondaryButton
            label="Back to recipe"
            className="text-onb-body"
            onPress={() => navigate(`/recipes/${r.id}`)}
          />
        </div>
      </div>
      {portion.sheet}
    </PageContainer>
  );
}
