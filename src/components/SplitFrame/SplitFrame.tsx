import type { ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import styles from "./SplitFrame.module.css";

export interface SplitFrameProps {
  /** Photo: a responsive base path (no extension) or a full `.webp` path. */
  image: string;
  /** `quiz` hides the photo on mobile; `default` shows a short banner. */
  variant?: "default" | "quiz";
  children: ReactNode;
}

/** Inset rounded photo card on the left, content on the right; stacks on mobile. */
export function SplitFrame({ image, variant = "default", children }: SplitFrameProps) {
  return (
    <div className={cn(styles.frame, variant === "quiz" && styles.quiz)}>
      <aside className={styles.media}>
        <AppImage
          src={image}
          alt=""
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className={styles.photo}
        />
        <div className={styles.copy}>
          <Logo light />
        </div>
      </aside>
      <main className={styles.content}>
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  );
}
