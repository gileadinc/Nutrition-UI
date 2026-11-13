"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { SecondaryButton } from "@/components/Button";
import { FormSection, ProfileLayout, Row, RowGroup } from "@/components/Track/ProfileParts";
import { getErrorMessage, profileApi } from "@/lib/api";
import { HELP } from "@/content";
import { useNavigate } from "@/lib/nav";
import { signOut, toast, useAppSession } from "@/lib/store";

const FAQ = HELP.faq;

function Question({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-warm-gray/60"
        >
          <span className="min-w-0 flex-1 text-sm type-item-title text-text-primary">{q}</span>
          <span className={cn("shrink-0 transition-transform", open && "rotate-90")}>
            <Icon name="chevronRight" size={16} color="var(--color-text-neutral-400)" />
          </span>
        </button>
      </h3>
      <div id={id} hidden={!open} className="px-4 pb-4 type-meta text-[13px] leading-5 text-text-secondary">
        {a}
      </div>
    </li>
  );
}

function YourData() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    setBusy(true);
    try {
      const data = await profileApi.exportData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "forkthis-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Couldn't export your data", { body: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await profileApi.deleteAccount();
      await signOut();
      toast.success("Account deleted");
      navigate("/welcome");
    } catch (err) {
      toast.error("Couldn't delete your account", { body: getErrorMessage(err) });
      setBusy(false);
    }
  };
  return (
    <FormSection title="Your data" className="mt-10">
      <div className="rounded-2xl border border-primary-soft bg-navy-50 p-4">
        <p className="text-sm type-section-title text-text-primary">Export or delete</p>
        <p className="mt-1 type-meta text-[13px] leading-5 text-text-secondary">
          Download everything we hold about you, or delete your account and all of its data.
        </p>
        {confirm ? (
          <div role="alertdialog" aria-label="Confirm deleting your account" className="mt-3">
            <p className="text-[14px] type-item-title text-text-primary">
              This can&apos;t be undone. Delete your account?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <SecondaryButton label="Cancel" onPress={() => setConfirm(false)} disabled={busy} />
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="h-14 rounded-2xl bg-brand-navy text-sm type-button text-text-on-dark disabled:opacity-60"
              >
                Yes, delete it
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <SecondaryButton label="Export my data" onPress={() => void exportData()} disabled={busy} />
            <SecondaryButton label="Delete account" onPress={() => setConfirm(true)} disabled={busy} />
          </div>
        )}
      </div>
    </FormSection>
  );
}

export function HelpSupportScreen() {
  const session = useAppSession();
  return (
    <ProfileLayout title="Help & support" subtitle="Answers, contact and your data.">
      <FormSection title="Common questions">
        <ul className="panel divide-y divide-border-divider overflow-hidden">
          {FAQ.map((f) => (
            <Question key={f.q} q={f.q} a={f.a} />
          ))}
        </ul>
      </FormSection>
      <FormSection title="Contact">
        <RowGroup>
          <Row icon="shareEmail" label="Email support" description="support@forkthis.app" href="mailto:support@forkthis.app" />
        </RowGroup>
      </FormSection>
      <FormSection title="Legal">
        <RowGroup>
          <Row icon="legalDocument" label="Terms of service" to="/you/legal/terms" />
          <Row icon="privacyPolicy" label="Privacy policy" to="/you/legal/privacy" />
          <Row icon="shield" label="Health disclaimer" to="/you/legal/health" />
        </RowGroup>
      </FormSection>
      {session.isSignedIn && <YourData />}
    </ProfileLayout>
  );
}
