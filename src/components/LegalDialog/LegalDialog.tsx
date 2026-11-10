"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LEGAL_DOCS, type LegalDocKey } from "./legal";
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
      <Dialog
        open={open}
        onOpenChange={(next, details) => {
          // Only the X / Close buttons dismiss it — not an outside click or Esc.
          if (!next && (details.reason === "outside-press" || details.reason === "escape-key")) {
            details.cancel();
            return;
          }
          setOpen(next);
        }}
      >
        <DialogContent className={styles.content}>
          <DialogTitle className={styles.title}>{content.title}</DialogTitle>
          <DialogDescription className={styles.intro}>Last updated {content.updated}</DialogDescription>
          <div className={styles.scroll}>
            {content.blocks.map((block, index) => {
              switch (block.kind) {
                case "h":
                  return <h3 key={index} className={styles.heading}>{block.text}</h3>;
                case "sub":
                  return <h4 key={index} className={styles.sub}>{block.text}</h4>;
                case "ul":
                  return (
                    <ul key={index} className={styles.list}>
                      {block.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  );
                case "table":
                  return (
                    <div key={index} className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>{block.head.map((cell) => <th key={cell}>{cell}</th>)}</tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row) => (
                            <tr key={row[0]}>
                              {row.map((cell, i) => <td key={i}>{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                default:
                  return (
                    <p key={index} className={block.strong ? styles.strong : undefined}>
                      {block.text}
                    </p>
                  );
              }
            })}
          </div>
          <button type="button" className={styles.close} onClick={() => setOpen(false)}>
            Close
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
