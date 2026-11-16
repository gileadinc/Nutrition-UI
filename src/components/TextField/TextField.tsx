import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "@/components/TextField/Field.module.css";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Short explanatory line under the input (e.g. why an optional field is useful). */
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className={styles.field}>
        <Label htmlFor={inputId} className={styles.label}>
          {label}
        </Label>
        <Input
          ref={ref}
          id={inputId}
          className={cn(styles.input, className)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...rest}
        />
        {hint && !error ? (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

TextField.displayName = "TextField";
