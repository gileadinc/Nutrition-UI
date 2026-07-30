import { InputHTMLAttributes, forwardRef, useId } from "react";
import styles from "./TextInput.module.css";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className={styles.field}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={[styles.input, error ? styles.inputError : "", className]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {error ? (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
