"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleGlyph } from "./GoogleGlyph";
import { SocialAuthDialog, type SocialProvider } from "./SocialAuthDialog";
import styles from "./SocialAuthButtons.module.css";

export interface SocialAuthButtonsProps {
  /** Text shown in the divider above the buttons. */
  dividerLabel?: string;
}

export function SocialAuthButtons({ dividerLabel = "Or continue with" }: SocialAuthButtonsProps) {
  const [provider, setProvider] = useState<SocialProvider | null>(null);

  return (
    <div>
      <div className={styles.divider} role="separator">
        <span className={styles.dividerLabel}>{dividerLabel}</span>
      </div>
      <div className={styles.buttons}>
        <Button
          type="button"
          variant="outline"
          className={styles.googleButton}
          onClick={() => setProvider("google")}
        >
          <GoogleGlyph />
          Google
        </Button>
      </div>

      <SocialAuthDialog
        provider={provider}
        onOpenChange={(open) => {
          if (!open) setProvider(null);
        }}
      />
    </div>
  );
}
