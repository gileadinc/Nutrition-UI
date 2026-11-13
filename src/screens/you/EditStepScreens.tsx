"use client";

import { useState, type ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { PrimaryButton } from "@/components/Button";
import { Icon, type IconName } from "@/components/Icon";
import { QUESTIONNAIRE } from "@/content";
import { getErrorMessage } from "@/lib/api";
import { useBack } from "@/lib/nav";
import {
  ACTIVITY_HINT,
  ACTIVITY_KEYS,
  ACTIVITY_LABEL,
  SURGICAL_CONTEXTS,
  type ActivityKey,
  type GoalKey,
  type SurgicalContext,
} from "@/lib/nutrition";
import { toast, useProfile } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Single-question edit pages opened from the profile (goal, activity level, surgery
 * context). Same copy and options as the onboarding questionnaire, laid out as a
 * focused page inside the app shell with Back / Save Changes.
 */

const BACK = "/you";

function StepFrame({
  eyebrow,
  title,
  description,
  saving,
  canSave,
  onSave,
  wide = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const back = useBack(BACK);
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col px-4 pb-6 pt-8 md:px-8">
      <div className={cn("m-auto w-full py-6", wide ? "max-w-[44rem]" : "max-w-[44rem]")}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 type-display text-[28px] leading-[1.15] tracking-[-1.08px] text-brand-navy md:text-[32px]">
          {title}
        </h1>
        <p className="mt-3 max-w-[36rem] type-meta text-[15px] leading-6 text-text-secondary">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
      <div className="mx-auto flex w-full max-w-[46rem] items-center justify-between gap-4">
        <button
          type="button"
          onClick={back}
          className="tap-44 rounded-full px-3 text-[15px] type-button text-primary hover:underline underline-offset-2"
        >
          Back
        </button>
        <PrimaryButton
          label={saving ? "Saving…" : "Save Changes"}
          onPress={onSave}
          disabled={!canSave || saving}
          className="w-auto px-10"
        />
      </div>
    </div>
  );
}

function useSave<T>(current: T | null, build: (v: T) => Parameters<ReturnType<typeof useProfile>["update"]>[0]) {
  const { update } = useProfile();
  const back = useBack(BACK);
  const [saving, setSaving] = useState(false);
  const save = async (value: T | null) => {
    if (value === null || saving) return;
    if (value === current) {
      back();
      return;
    }
    setSaving(true);
    try {
      await update(build(value));
      toast.success("Saved");
      back();
    } catch (e) {
      toast.error(getErrorMessage(e));
      setSaving(false);
    }
  };
  return { saving, save };
}

/* ------------------------------------------------------------------ goal */

export function GoalEditScreen() {
  const { profile } = useProfile();
  const [picked, setPicked] = useState<GoalKey | null>(null);
  const value = picked ?? profile?.goal ?? null;
  const { saving, save } = useSave<GoalKey>(profile?.goal ?? null, (goal) => ({ goal }));
  const options = QUESTIONNAIRE.goalOptions as {
    value: GoalKey;
    title: string;
    subtitle: string;
    image: { src: string; alt: string };
  }[];
  const step = QUESTIONNAIRE.steps.goal;

  return (
    <StepFrame
      eyebrow={step.eyebrow}
      title={step.title}
      description={`It decides whether your daily target leans toward a deficit, a surplus or maintenance.`}
      saving={saving}
      canSave={value !== null}
      onSave={() => void save(value)}
      wide
    >
      <div role="radiogroup" aria-label={step.title} className="grid gap-4 sm:grid-cols-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPicked(o.value)}
              className={cn(
                "group relative flex min-h-40 overflow-hidden rounded-2xl border bg-white text-left transition-colors",
                on ? "border-accent ring-1 ring-accent" : "border-border-default hover:border-text-neutral-400",
              )}
            >
              <span className="relative z-10 flex w-1/2 flex-col p-4">
                <span className="text-[15px] type-button leading-5 text-brand-navy">{o.title}</span>
                <span className="mt-1 text-[12px] leading-4 text-text-secondary">{o.subtitle}</span>
              </span>
              <AppImage
                src={o.image.src}
                alt={o.image.alt}
                sizes="(min-width: 640px) 25vw, 50vw"
                className="absolute inset-y-0 right-0 h-full w-3/5 object-cover"
              />
            </button>
          );
        })}
      </div>
    </StepFrame>
  );
}

/* -------------------------------------------------------------- activity */

const ACTIVITY_ICON: Record<ActivityKey, IconName> = {
  mostlyInactive: "person",
  lightlyActive: "walking",
  moderatelyActive: "bicycle",
  veryActive: "runningShoes",
  extremelyActive: "dumbbell",
};

function OptionCard({
  selected,
  icon,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean;
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPress}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors",
        selected ? "bg-selected text-on-selected" : "bg-white text-text-primary hover:bg-brand-warm-gray",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-white" : "bg-icon-well",
        )}
      >
        <Icon name={icon} size={20} color="var(--color-icon-well-ink)" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] type-button leading-5">{title}</span>
        <span className={cn("block text-[12px] leading-4", selected ? "text-white/90" : "text-text-secondary")}>
          {subtitle}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-white" : "border-border-default",
        )}
      >
        {selected && <Icon name="tick" size={14} color="#fff" />}
      </span>
    </button>
  );
}

export function ActivityEditScreen() {
  const { profile } = useProfile();
  const [picked, setPicked] = useState<ActivityKey | null>(null);
  const value = picked ?? profile?.activityLevel ?? null;
  const { saving, save } = useSave<ActivityKey>(profile?.activityLevel ?? null, (activityLevel) => ({
    activityLevel,
  }));
  const step = QUESTIONNAIRE.steps.activity;
  // "Extremely active" is only offered if it is already the saved level.
  const keys = ACTIVITY_KEYS.filter((k) => k !== "extremelyActive" || profile?.activityLevel === k);

  return (
    <StepFrame
      eyebrow="Your week"
      title={step.title}
      description="Activity multiplies your baseline. Pick a typical week, not your best one."
      saving={saving}
      canSave={value !== null}
      onSave={() => void save(value)}
    >
      <div role="radiogroup" aria-label={step.title} className="grid gap-3 sm:grid-cols-2">
        {keys.map((k) => (
          <OptionCard
            key={k}
            selected={value === k}
            icon={ACTIVITY_ICON[k]}
            title={ACTIVITY_LABEL[k]}
            subtitle={ACTIVITY_HINT[k]}
            onPress={() => setPicked(k)}
          />
        ))}
      </div>
    </StepFrame>
  );
}

/* --------------------------------------------------------------- surgery */

export function SurgeryEditScreen() {
  const { profile } = useProfile();
  const [picked, setPicked] = useState<SurgicalContext | null>(null);
  const value = picked ?? profile?.surgicalContext ?? null;
  const { saving, save } = useSave<SurgicalContext>(profile?.surgicalContext ?? null, (surgicalContext) => ({
    surgicalContext,
  }));
  const step = QUESTIONNAIRE.steps.surgery;
  const meta = QUESTIONNAIRE.surgeryMeta as Record<string, { subtitle: string; icon: IconName }>;

  return (
    <StepFrame
      eyebrow={step.eyebrow}
      title={step.title}
      description="Private to you, and you can change it later. Choose Prefer not to say and the app keeps recommendations general and hides surgery-specific resources."
      saving={saving}
      canSave={value !== null}
      onSave={() => void save(value)}
    >
      <div role="radiogroup" aria-label={step.title} className="grid gap-3 sm:grid-cols-2">
        {SURGICAL_CONTEXTS.map((s) => (
          <OptionCard
            key={s}
            selected={value === s}
            icon={meta[s].icon}
            title={s}
            subtitle={meta[s].subtitle}
            onPress={() => setPicked(s)}
          />
        ))}
      </div>
    </StepFrame>
  );
}
