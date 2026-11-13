"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { CheckMark } from "@/components/Layout";
import { AppTextField } from "@/components/TextField";
import { FormSection, ProfileLayout } from "@/components/Track/ProfileParts";
import { ALLERGENS, DIETARY_PREFERENCES, addCustomEntry } from "@/lib/nutrition";
import { getErrorMessage } from "@/lib/api";
import { toast, useProfile, useRequireAccount } from "@/lib/store";
import { SELECTED_CHIP } from "@/components/styles";

function ChipPicker({
  label,
  presets,
  selected,
  onChange,
  otherLabel,
  otherPlaceholder,
}: {
  label: string;
  presets: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  otherLabel: string;
  otherPlaceholder: string;
}) {
  const [text, setText] = useState("");
  const custom = selected.filter((s) => !presets.includes(s));
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  const add = () => {
    const next = text.split(",").reduce((acc, part) => addCustomEntry(acc, part, presets), selected);
    if (next !== selected) onChange(next);
    setText("");
  };
  return (
    <div className="panel p-4">
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const on = selected.includes(p);
          return (
            <button
              key={p}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(p)}
              className={cn(
                "flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[14px] transition-colors",
                on
                  ? cn(SELECTED_CHIP, "type-button")
                  : "type-button-secondary border-border-default bg-white text-text-secondary hover:border-text-neutral-400",
              )}
            >
              {on && <CheckMark size={12} />}
              {p}
            </button>
          );
        })}
        {custom.map((c) => (
          <span
            key={c}
            className={cn(
              "flex min-h-10 max-w-full items-center gap-1 rounded-full py-1 pl-3.5 pr-1 text-[14px] type-button",
              SELECTED_CHIP,
            )}
          >
            <CheckMark />
            <span className="min-w-0 break-words">{c}</span>
            <button
              type="button"
              aria-label={`Remove ${c}`}
              onClick={() => toggle(c)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full"
            >
              <Icon name="close" size={14} color="var(--color-on-selected)" />
            </button>
          </span>
        ))}
      </div>
      <form
        className="mt-4 flex items-end gap-2 border-t border-border-divider pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <AppTextField className="min-w-0 flex-1" label={otherLabel} placeholder={otherPlaceholder} value={text} onChange={setText} />
        <button
          type="submit"
          disabled={!text.trim()}
          className="panel h-14 shrink-0 px-5 text-sm type-button-secondary text-brand-navy disabled:text-text-neutral-400"
        >
          Add
        </button>
      </form>
    </div>
  );
}

const count = (n: number) => (n === 0 ? "None selected" : `${n} selected`);

export function DietaryPreferencesScreen() {
  const { profile, update } = useProfile();
  const requireAccount = useRequireAccount();
  const save = async (patch: { dietaryPreferences?: string[]; allergies?: string[] }) => {
    if (!requireAccount("Food preferences")) return;
    try {
      await update(patch);
    } catch (err) {
      toast.error("Couldn't save your preferences", { body: getErrorMessage(err) });
    }
  };
  const diet = profile?.dietaryPreferences ?? [];
  const allergies = profile?.allergies ?? [];
  return (
    <ProfileLayout title="Food preferences" subtitle="Saved as you tap. Used to rank and flag what you see.">
      <FormSection
        title="Diet"
        action={count(diet.length)}
        description="Matching hacks and recipes rank first. Nothing is hidden."
      >
        <ChipPicker
          label="Diet"
          presets={DIETARY_PREFERENCES}
          selected={diet}
          onChange={(dietaryPreferences) => void save({ dietaryPreferences })}
          otherLabel="Other preferences"
          otherPlaceholder="e.g. Low FODMAP, halal"
        />
      </FormSection>
      <FormSection
        title="Allergies"
        action={count(allergies.length)}
        description={
          <div className="flex items-start gap-2.5 rounded-xl bg-missed-dose-surface p-3 text-text-primary">
            <Icon name="alert" size={16} color="var(--color-text-secondary)" />
            <p className="min-w-0 flex-1 type-meta text-[13px] leading-5">
              We flag recipes whose ingredients name something you avoid. We can&apos;t confirm a recipe is free of
              anything — always check the packaging and ask the restaurant.
            </p>
          </div>
        }
      >
        <ChipPicker
          label="Allergies"
          presets={ALLERGENS}
          selected={allergies}
          onChange={(a) => void save({ allergies: a })}
          otherLabel="Other allergies"
          otherPlaceholder="e.g. Mustard, celery"
        />
      </FormSection>
    </ProfileLayout>
  );
}
