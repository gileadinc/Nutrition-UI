import { ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "outline";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, type = "button", ...rest }, ref) => {
    const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");
    return <button ref={ref} type={type} className={classes} {...rest} />;
  },
);

Button.displayName = "Button";
