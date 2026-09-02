"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataState } from "@/components/DataState";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { useApiResource } from "@/lib/hooks";
import {
  profileApi,
  getErrorMessage,
  type Preferences,
  type Profile,
} from "@/lib/api";
import type { ProfileUpdate } from "@/lib/api/endpoints/profile";
import { clearSession, clearGuestSessionId } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

const GOALS = ["weight_loss", "maintenance", "muscle_gain", "surgical_recovery"];
const ACTIVITY = ["sedentary", "lightly_active", "moderately_active", "very_active"];

export default function SettingsPage() {
  const router = useRouter();
  const profile = useApiResource(() => profileApi.getProfile(), []);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.heading}>Settings</h1>
        <p className={styles.subheading}>Your profile, targets, and notification preferences.</p>
      </header>

      <DataState resource={profile}>
        {(data) => (
          <SettingsForms
            profile={data}
            onSaved={() => profile.refetch()}
            onDeleted={() => {
              clearSession();
              clearGuestSessionId();
              router.push(ROUTES.home);
            }}
          />
        )}
      </DataState>
    </div>
  );
}

function SettingsForms({
  profile,
  onSaved,
  onDeleted,
}: {
  profile: Profile;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  return (
    <>
      <ProfileSection profile={profile} onSaved={onSaved} />
      <Separator />
      <PreferencesSection preferences={profile.preferences} onSaved={onSaved} />
      <Separator />
      <DangerZone email={profile.email} onDeleted={onDeleted} />
    </>
  );
}

function ProfileSection({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [form, setForm] = useState<ProfileUpdate>({
    displayName: profile.displayName ?? "",
    givenName: profile.givenName ?? "",
    familyName: profile.familyName ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    sex: profile.sex ?? "",
    heightCm: profile.heightCm ?? undefined,
    weightKg: profile.weightKg ?? undefined,
    goal: profile.goal ?? "",
    activityLevel: profile.activityLevel ?? "",
    surgicalContext: profile.surgicalContext ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: ProfileUpdate = {
        displayName: form.displayName || undefined,
        givenName: form.givenName || undefined,
        familyName: form.familyName || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        sex: form.sex || undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        goal: form.goal || undefined,
        activityLevel: form.activityLevel || undefined,
        surgicalContext: form.surgicalContext || undefined,
      };
      await profileApi.updateProfile(payload);
      toast.success("Profile updated");
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Profile</h2>
      <p className={styles.sectionEmail}>{profile.email}</p>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.grid}>
          <TextField
            label="First name"
            value={form.givenName ?? ""}
            onChange={(e) => setForm({ ...form, givenName: e.target.value })}
          />
          <TextField
            label="Last name"
            value={form.familyName ?? ""}
            onChange={(e) => setForm({ ...form, familyName: e.target.value })}
          />
          <TextField
            label="Display name"
            value={form.displayName ?? ""}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <TextField
            label="Date of birth"
            type="date"
            value={form.dateOfBirth ?? ""}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sex">
              Sex
            </label>
            <select
              id="sex"
              className={styles.select}
              value={form.sex ?? ""}
              onChange={(e) => setForm({ ...form, sex: e.target.value })}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <TextField
            label="Height (cm)"
            type="number"
            value={form.heightCm?.toString() ?? ""}
            onChange={(e) => setForm({ ...form, heightCm: e.target.value as unknown as number })}
          />
          <TextField
            label="Weight (kg)"
            type="number"
            value={form.weightKg?.toString() ?? ""}
            onChange={(e) => setForm({ ...form, weightKg: e.target.value as unknown as number })}
          />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="goal">
              Goal
            </label>
            <select
              id="goal"
              className={styles.select}
              value={form.goal ?? ""}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            >
              <option value="">Not set</option>
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {g.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="activity">
              Activity level
            </label>
            <select
              id="activity"
              className={styles.select}
              value={form.activityLevel ?? ""}
              onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
            >
              <option value="">Not set</option>
              {ACTIVITY.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.spanFull}>
            <TextField
              label="Surgical / medical context"
              value={form.surgicalContext ?? ""}
              onChange={(e) => setForm({ ...form, surgicalContext: e.target.value })}
            />
          </div>
        </div>

        {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PreferencesSection({
  preferences,
  onSaved,
}: {
  preferences: Preferences;
  onSaved: () => void;
}) {
  const [notifications, setNotifications] = useState(preferences.notifications);
  const [privacy, setPrivacy] = useState(preferences.privacy);
  const [targets, setTargets] = useState(preferences.nutritionTargets);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await profileApi.updatePreferences({
        notifications,
        privacy,
        nutritionTargets: {
          calories: Number(targets.calories) || 0,
          protein: Number(targets.protein) || 0,
          carbs: Number(targets.carbs) || 0,
          fat: Number(targets.fat) || 0,
        },
      });
      toast.success("Preferences updated");
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Preferences</h2>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.prefColumns}>
          <fieldset className={styles.fieldset}>
            <legend>Notifications</legend>
            {(
              [
                ["enabled", "All notifications"],
                ["mealReminders", "Meal reminders"],
                ["goalUpdates", "Goal updates"],
                ["productUpdates", "Product updates"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className={styles.check}>
                <Checkbox
                  checked={Boolean(notifications[key as keyof typeof notifications])}
                  onCheckedChange={(c) =>
                    setNotifications({ ...notifications, [key]: Boolean(c) })
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>Privacy</legend>
            {(
              [
                ["analytics", "Usage analytics"],
                ["personalizedRecommendations", "Personalized recommendations"],
                ["locationServices", "Location services"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className={styles.check}>
                <Checkbox
                  checked={Boolean(privacy[key as keyof typeof privacy])}
                  onCheckedChange={(c) => setPrivacy({ ...privacy, [key]: Boolean(c) })}
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Daily targets</legend>
          <div className={styles.targetsGrid}>
            <TextField
              label="Calories"
              type="number"
              value={targets.calories?.toString() ?? ""}
              onChange={(e) =>
                setTargets({ ...targets, calories: e.target.value as unknown as number })
              }
            />
            <TextField
              label="Protein (g)"
              type="number"
              value={targets.protein?.toString() ?? ""}
              onChange={(e) =>
                setTargets({ ...targets, protein: e.target.value as unknown as number })
              }
            />
            <TextField
              label="Carbs (g)"
              type="number"
              value={targets.carbs?.toString() ?? ""}
              onChange={(e) =>
                setTargets({ ...targets, carbs: e.target.value as unknown as number })
              }
            />
            <TextField
              label="Fat (g)"
              type="number"
              value={targets.fat?.toString() ?? ""}
              onChange={(e) =>
                setTargets({ ...targets, fat: e.target.value as unknown as number })
              }
            />
          </div>
        </fieldset>

        {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function DangerZone({ email, onDeleted }: { email: string; onDeleted: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Danger zone</h2>
      <p className={styles.dangerText}>
        Permanently delete your account and all personal data. This cannot be undone.
      </p>
      <Button type="button" variant="destructive" onClick={() => setDialogOpen(true)}>
        Delete account
      </Button>

      <DeleteAccountDialog
        open={dialogOpen}
        email={email}
        onClose={() => setDialogOpen(false)}
        onDeleted={() => {
          toast.success("Account deleted");
          onDeleted();
        }}
      />
    </section>
  );
}
