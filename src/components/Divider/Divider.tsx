import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./Divider.module.css";

export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: DividerOrientation;
}

export function Divider({ orientation = "horizontal", className, ...rest }: DividerProps) {
  return (
    <hr
      className={cn(styles.divider, styles[orientation], className)}
      aria-orientation={orientation}
      {...rest}
    />
  );
}
