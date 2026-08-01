import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Container.module.css";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Container({ children, className, ...rest }: ContainerProps) {
  const classes = cn(styles.container, className);
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
