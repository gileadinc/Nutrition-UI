import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./FormErrorMessage.module.css";

export interface FormErrorMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  children: string;
}

export function FormErrorMessage({ children, className, ...rest }: FormErrorMessageProps) {
  const classes = cn(styles.message, className);
  return (
    <p className={classes} role="alert" {...rest}>
      {children}
    </p>
  );
}
