import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label. Omit for a standalone input (pass aria-label instead). */
  label?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? <Label htmlFor={inputId}>{label}</Label> : null}
        <Input
          ref={ref}
          id={inputId}
          className={cn(className)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
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
