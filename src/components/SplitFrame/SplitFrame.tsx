import type { ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import styles from "./SplitFrame.module.css";

export interface SplitFrameCaption {
  /** Small uppercase eyebrow. */
  label: string;
  /** Headline (may contain <strong> emphasis). */
  title: ReactNode;
  body: string;
  /** Headline size: `lg` = 32px, `md` = 30px. */
  size?: "lg" | "md";
}

export interface SplitFrameProps {
  /** Photo: a responsive base path (no extension) or a full `.webp` path. */
  image: string;
  /** Text laid over the bottom of the photo (desktop only). */
  caption?: SplitFrameCaption;
  /** `quiz` hides the photo on mobile; `default` shows a short banner. */
  variant?: "default" | "quiz" | "quizTall" | "quizCentered";
  children: ReactNode;
}

/** Inset rounded photo card on the left, content on the right; stacks on mobile. */
export function SplitFrame({ image, caption, variant = "default", children }: SplitFrameProps) {
  return (
    <div className={cn(
        styles.frame,
        variant !== "default" && styles.quiz, variant === "quizTall" && styles.quizTall,
        variant === "quizCentered" && styles.quizCentered,
      )}>
      <aside className={styles.media}>
        <AppImage
          key={image}
          src={image}
          alt=""
          priority
          sizes="(min-width: 1024px) 46vw, 100vw"
          className={styles.photo}
        />
        <div className={styles.banner}>
          <Logo light mark />
        </div>
        {caption ? (
          <div className={styles.caption}>
            <p className={styles.label}>{caption.label}</p>
            <p className={cn(styles.title, caption.size === "md" && styles.titleMd)}>
              {caption.title}
            </p>
            <p className={styles.body}>{caption.body}</p>
          </div>
        ) : null}
      </aside>
      <main className={styles.content}>
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  );
}
