"use client";

import { useId, useState } from "react";
import { PrimaryButton } from "@/components/Button";
import { GoalCards, OptionRadioGroup, type GoalChoice } from "@/components/Onboarding/OptionGroup";
import { goalKeyFor, type GoalCardId } from "@/components/Quiz/quizData";
import type { IconName } from "@/components/Icon";
import { getErrorMessage } from "@/lib/api";
import { useNavigate } from "@/lib/nav";
import { ACTIVITY_HINT, ACTIVITY_KEYS, ACTIVITY_LABEL, type ActivityKey } from "@/lib/nutrition";
import { toast, useProfile } from "@/lib/store";

const CARD_FOR: Record<GoalChoice, GoalCardId> = {
  eatHealthier: "eatOut",
  freshIdeas: "recomp",
  lose: "lose",
  trackProgress: "track",
};

const ACTIVITY_ICON: Record<ActivityKey, IconName> = {
  mostlyInactive: "person",
  lightlyActive: "walking",
  moderatelyActive: "bicycle",
  veryActive: "runningShoes",
  extremelyActive: "dumbbell",
};

/** `/you/goal` (kind="goal") and `/you/activity-level` (kind="activity"): one full-page question each. */
export function ProfilePreferenceScreen({ kind }: { kind: "goal" | "activity" }) {
  const uid = useId();
  const navigate = useNavigate();
  const { profile, update } = useProfile();
  const isGoal = kind === "goal";
  const [goals, setGoals] = useState<GoalChoice[] | null>(null);
  const [activity, setActivity] = useState<ActivityKey | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const currentGoals: GoalChoice[] =
    goals ??
    (profile?.goal === "lose"
      ? ["lose"]
      : profile?.goal === "recomp"
        ? ["freshIdeas"]
        : ["trackProgress"]);
  const currentActivity = activity === undefined ? (profile?.activityLevel ?? null) : activity;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isGoal) await update({ goal: goalKeyFor(currentGoals.map((g) => CARD_FOR[g])) });
      else if (currentActivity) await update({ activityLevel: currentActivity });
      navigate("/you");
    } catch (e) {
      toast.error(getErrorMessage(e));
      setBusy(false);
    }
  };

  const options = ACTIVITY_KEYS.filter(
    (k) => k !== "extremelyActive" || profile?.activityLevel === k,
  ).map((k) => ({
    value: k,
    title: ACTIVITY_LABEL[k],
    subtitle: ACTIVITY_HINT[k],
    icon: ACTIVITY_ICON[k],
  }));

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-1.25rem)] w-full max-w-[55.25rem] flex-col px-5 pb-11 md:px-8">
      <div className="flex flex-1 items-center py-8 lg:pb-0 lg:pt-28">
        <section className="w-full">
          <p className="text-[13px] type-eyebrow uppercase tracking-[0.78px] text-eyebrow">
            {isGoal ? "Your goal" : "Your week"}
          </p>
          <h1
            id={uid}
            className="mt-2 text-[32px] type-display leading-[36.8px] tracking-[-0.8px] text-brand-navy"
          >
            {isGoal ? "What's your main goal?" : "How active are you right now?"}
          </h1>
          <p
            id={`${uid}-description`}
            className="mt-3 max-w-[34rem] text-base type-body leading-6 text-text-secondary"
          >
            {isGoal ? (
              <>
                It decides whether your daily target leans toward a deficit, a surplus or
                maintenance.
                <br />
                Click all that apply
              </>
            ) : (
              "Activity multiplies your baseline. Pick a typical week, not your best one."
            )}
          </p>
          {isGoal ? (
            <GoalCards
              value={currentGoals}
              onChange={setGoals}
              labelledBy={uid}
              describedBy={`${uid}-description`}
              className="mt-8"
            />
          ) : (
            <OptionRadioGroup
              options={options}
              value={currentActivity}
              onChange={setActivity}
              labelledBy={uid}
              describedBy={`${uid}-description`}
              className="mt-6 sm:grid sm:grid-cols-2 [&_button]:min-h-[110px]"
            />
          )}
        </section>
      </div>
      <footer className="flex items-center gap-3 pt-4">
        <button
          type="button"
          className="min-h-14 rounded-full px-2 type-button-secondary text-primary"
          onClick={() => navigate("/you")}
        >
          Back
        </button>
        <PrimaryButton
          label={busy ? "Saving..." : "Save Changes"}
          onPress={() => void save()}
          disabled={busy || (isGoal ? currentGoals.length === 0 : !currentActivity)}
          className="ml-auto max-w-60"
        />
      </footer>
    </div>
  );
}
