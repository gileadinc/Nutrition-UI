"use client";

import { useId } from "react";
import styles from "./admin-form.module.css";

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required ? <span className={styles.req}> *</span> : null}
      </label>
      <input
        id={id}
        className={styles.input}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      placeholder={placeholder}
    />
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required ? <span className={styles.req}> *</span> : null}
      </label>
      <textarea
        id={id}
        className={styles.textarea}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}

/** Comma-or-newline separated list, edited as text. */
export function ListInput({
  label,
  value,
  onChange,
  hint = "One per line, or comma-separated.",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return <TextArea label={label} value={value} onChange={onChange} rows={3} hint={hint} />;
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---- list <-> text helpers ---- */

export function listToText(list: string[] | null | undefined): string {
  return (list ?? []).join("\n");
}

export function textToList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function numOrUndef(s: string): number | undefined {
  if (s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
