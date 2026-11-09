"use client";

import { AppTextField } from "./AppTextField";

export interface NameValue {
  firstName: string;
  middleName: string;
  lastName: string;
}

export const FIRST_NAME_ERROR = "Enter your first name.";

/** Returns an error string when the first name is blank. */
export const validateFirstName = (v: NameValue): string | null =>
  v.firstName.trim() ? null : FIRST_NAME_ERROR;

/** First / middle / last name inputs (middle + last optional). */
export function NameFields({
  value,
  onChange,
  error,
}: {
  value: NameValue;
  onChange: (next: NameValue) => void;
  error?: string | null;
}) {
  return (
    <>
      <AppTextField
        label="First name"
        autoComplete="given-name"
        value={value.firstName}
        error={error}
        onChange={(firstName) => onChange({ ...value, firstName })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <AppTextField
          label="Middle name or initials"
          placeholder="Optional"
          autoComplete="additional-name"
          value={value.middleName}
          onChange={(middleName) => onChange({ ...value, middleName })}
        />
        <AppTextField
          label="Last name"
          placeholder="Optional"
          autoComplete="family-name"
          value={value.lastName}
          onChange={(lastName) => onChange({ ...value, lastName })}
        />
      </div>
    </>
  );
}
