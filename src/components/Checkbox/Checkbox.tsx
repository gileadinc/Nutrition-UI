import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={cn(styles.field, className)}>
        <input ref={ref} id={inputId} type="checkbox" className={styles.input} {...rest} />
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
