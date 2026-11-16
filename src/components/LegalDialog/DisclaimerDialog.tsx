"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DISCLAIMER } from "./legal";
import styles from "./LegalDialog.module.css";

export interface DisclaimerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the person has read to the bottom and accepted. */
  onAccept: () => void;
}

/**
 * The scroll-gated body. It only mounts while the dialog is open, so the
 * "read to the end" gate re-arms on every open without resetting state by hand.
 */
function DisclaimerBody({
  onOpenChange,
  onAccept,
}: Pick<DisclaimerDialogProps, "onOpenChange" | "onAccept">) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setAtBottom(true);
    };
    // Short content that doesn't overflow counts as already read.
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, []);

  return (
    <>
      <DialogTitle className={styles.title}>{DISCLAIMER.title}</DialogTitle>
      <DialogDescription className={styles.intro}>{DISCLAIMER.intro}</DialogDescription>
      <div
        className={styles.scroll}
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label={DISCLAIMER.title}
      >
        {DISCLAIMER.sections.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h3>{section.heading}</h3>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>

      {!atBottom ? (
        <p className={styles.scrollHint} role="status">
          Scroll to the bottom to continue.
        </p>
      ) : null}

      <div className={styles.disclaimerActions}>
        <button type="button" className={styles.secondaryAction} onClick={() => onOpenChange(false)}>
          Go back
        </button>
        <button type="button" className={styles.close} disabled={!atBottom} onClick={onAccept}>
          I understand and agree
        </button>
      </div>
    </>
  );
}

/**
 * Shown after Register. The person must scroll to the bottom before the accept
 * button enables — a deliberate read-through gate, unlike the Terms/Privacy
 * checkbox on the form itself.
 */
export function DisclaimerDialog({ open, onOpenChange, onAccept }: DisclaimerDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        // Make it a deliberate dismissal, as with the Terms dialog.
        if (!next && (details.reason === "outside-press" || details.reason === "escape-key")) {
          details.cancel();
          return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className={styles.content}>
        {open ? <DisclaimerBody onOpenChange={onOpenChange} onAccept={onAccept} /> : null}
      </DialogContent>
    </Dialog>
  );
}
