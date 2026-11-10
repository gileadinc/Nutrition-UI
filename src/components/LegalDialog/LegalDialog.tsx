"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LEGAL_DOCS, LEGAL_UPDATED, type LegalDocKey } from "./legal";
import styles from "./LegalDialog.module.css";

export interface LegalDialogProps {
  doc: LegalDocKey;
  /** Link text. */
  children: ReactNode;
}

/** Inline link that opens the Terms / Privacy text in a modal instead of navigating away. */
export function LegalDialog({ doc, children }: LegalDialogProps) {
  const [open, setOpen] = useState(false);
  const content = LEGAL_DOCS[doc];

  function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    // The link sits inside a checkbox label — don't toggle the checkbox.
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      <button type="button" className={styles.link} onClick={handleOpen}>
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={styles.content}>
          <DialogTitle className={styles.title}>{content.title}</DialogTitle>
          <DialogDescription className={styles.intro}>{content.intro}</DialogDescription>
          <div className={styles.scroll}>
            {content.sections.map((section) => (
              <section key={section.heading} className={styles.section}>
                <h3>{section.heading}</h3>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
            <p className={styles.updated}>Last updated {LEGAL_UPDATED}</p>
          </div>
          <button type="button" className={styles.close} onClick={() => setOpen(false)}>
            Close
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
