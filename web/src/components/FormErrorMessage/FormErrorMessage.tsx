import { HTMLAttributes } from "react";
import styles from "./FormErrorMessage.module.css";

export interface FormErrorMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  children: string;
}

export function FormErrorMessage({ children, className, ...rest }: FormErrorMessageProps) {
  const classes = className ? `${styles.message} ${className}` : styles.message;
  return (
    <p className={classes} role="alert" {...rest}>
      {children}
    </p>
  );
}
