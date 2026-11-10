import type { ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import styles from "./SplitFrame.module.css";

export interface SplitFrameProps {
  /** Local image base, e.g. `/img/auth/login-hero`. */
  image: string;
  /** Optional eyebrow / title / body copy laid over the photo (desktop). */
  label?: string;
  title?: string;
  body?: string;
  /** `ink` = dark text over a light photo. */
  tone?: "light" | "ink";
  imagePosition?: "center" | "top";
  /** `quiz` gives the photo a narrower column and hides it on mobile. */
  variant?: "default" | "quiz";
  children: ReactNode;
}

/** Photo on the left, content on the right; stacks with a short banner on mobile. */
export function SplitFrame({
  image,
  label,
  title,
  body,
  tone = "light",
  imagePosition = "center",
  variant = "default",
  children,
}: SplitFrameProps) {
  const ink = tone === "ink";
  return (
    <div className={cn(styles.frame, variant === "quiz" && styles.quiz)}>
      <aside className={styles.media}>
        <AppImage
          src={image}
          alt=""
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className={cn(styles.photo, imagePosition === "top" && styles.photoTop)}
        />
        <div className={cn(styles.copy, ink && styles.ink)}>
          <Logo light={!ink} />
          {title ? (
            <div className={styles.text}>
              {label ? <p className={styles.label}>{label}</p> : null}
              <p className={styles.title}>{title}</p>
              {body ? <p className={styles.body}>{body}</p> : null}
            </div>
          ) : null}
        </div>
      </aside>
      <main className={styles.content}>
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  );
}
