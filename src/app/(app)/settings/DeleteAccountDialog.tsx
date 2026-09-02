"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { profileApi, getErrorMessage } from "@/lib/api";
import styles from "./DeleteAccountDialog.module.css";

export interface DeleteAccountDialogProps {
  open: boolean;
  /** The signed-in account's email — must be typed to confirm. */
  email: string;
  onClose: () => void;
  /** Called after the account is deleted. */
  onDeleted: () => void;
}

export function DeleteAccountDialog({
  open,
  email,
  onClose,
  onDeleted,
}: DeleteAccountDialogProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Re-seed on open (render-phase adjust-on-prop-change, no effect).
  const [seededOpen, setSeededOpen] = useState(open);
  if (open !== seededOpen) {
    setSeededOpen(open);
    if (open) {
      setValue("");
      setError(null);
      setBusy(false);
    }
  }

  const matches = value.trim().toLowerCase() === email.trim().toLowerCase();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!matches) {
      setError("The email doesn't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await profileApi.deleteAccount();
      onDeleted();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <DialogPrimitive.Root
      open={open}
      disablePointerDismissal
      onOpenChange={(nextOpen, details) => {
        if (nextOpen || busy) return;
        if (details.reason === "escape-key") return;
        onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={styles.backdrop} />
        <DialogPrimitive.Popup className={styles.popup}>
          <span className={styles.icon} aria-hidden="true">
            <AlertTriangle className="size-5" />
          </span>
          <DialogPrimitive.Title className={styles.title}>
            Delete your account?
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className={styles.description}>
            This permanently deletes your account and all personal data — profile,
            tracking history, and saved items. This cannot be undone.
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <TextField
              label={`Type ${email} to confirm`}
              type="email"
              autoComplete="off"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
            />

            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

            <div className={styles.actions}>
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={busy || !matches}
              >
                {busy ? "Deleting…" : "Delete account"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
