"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Dialog } from "@/components/Collections/Dialog";
import { LEGAL_DOCS, type LegalBlock, type LegalDocKey } from "./legal";

export interface LegalDialogProps {
  doc: LegalDocKey;
  /** Link text. */
  children: ReactNode;
}

const PROSE = "text-[15px] leading-6 font-light text-text-primary";

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "h":
      return (
        <h3 className="mt-6 text-base leading-6 type-section-title text-text-primary">
          {block.text}
        </h3>
      );
    case "sub":
      return (
        <h4 className="mt-4 text-[15px] leading-6 type-section-title text-text-primary">
          {block.text}
        </h4>
      );
    case "ul":
      return (
        <ul className={`mt-2 list-disc pl-5 ${PROSE}`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th
                    key={cell}
                    className="border border-border-divider bg-navy-soft px-2.5 py-2 text-left align-top text-[15px] leading-6 type-section-title text-text-primary"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={`border border-border-divider px-2.5 py-2 text-left align-top ${PROSE}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return (
        <p className={`mt-2 ${PROSE} ${block.strong ? "type-section-title" : ""}`}>{block.text}</p>
      );
  }
}

/** Inline link that opens a legal document in a modal instead of navigating away. */
export function LegalDialog({ doc, children }: LegalDialogProps) {
  const [open, setOpen] = useState(false);
  const content = LEGAL_DOCS[doc];

  function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    // The link sits next to a checkbox: don't toggle it.
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="type-button text-primary underline underline-offset-2"
      >
        {children}
      </button>
      {open && (
        <Dialog
          title={content.title}
          description={`Last updated ${content.updated}`}
          onClose={() => setOpen(false)}
          lockBackdrop
          className="md:max-w-2xl"
        >
          <div className="max-h-[min(60dvh,32rem)] overflow-y-auto pr-2">
            {content.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-brand-navy text-base type-button text-white transition-colors hover:bg-primary-hover"
          >
            Close
          </button>
        </Dialog>
      )}
    </>
  );
}
