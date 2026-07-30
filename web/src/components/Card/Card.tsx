import { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...rest }: CardProps) {
  const classes = className ? `${styles.card} ${className}` : styles.card;
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
