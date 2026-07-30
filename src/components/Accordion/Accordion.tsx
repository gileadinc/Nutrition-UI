"use client";

import { ReactNode, useId, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./Accordion.module.css";

export interface AccordionItem {
  value: string;
  question: string;
  answer: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenValue?: string;
  className?: string;
}

export function Accordion({ items, defaultOpenValue, className }: AccordionProps) {
  const [openValue, setOpenValue] = useState<string | null>(defaultOpenValue ?? null);
  const baseId = useId();

  return (
    <div className={cn(styles.wrapper, className)}>
      {items.map((item) => {
        const isOpen = item.value === openValue;
        const buttonId = `${baseId}-trigger-${item.value}`;
        const panelId = `${baseId}-panel-${item.value}`;

        return (
          <div key={item.value} className={styles.item}>
            <h3 className={styles.heading}>
              <button
                type="button"
                id={buttonId}
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenValue(isOpen ? null : item.value)}
              >
                <span>{item.question}</span>
                <span className={cn(styles.icon, isOpen && styles.iconOpen)} aria-hidden="true">
                  +
                </span>
              </button>
            </h3>
            {isOpen ? (
              <div id={panelId} role="region" aria-labelledby={buttonId} className={styles.panel}>
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
