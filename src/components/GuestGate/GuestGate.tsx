"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { ROUTES } from "@/lib/constants";
import styles from "./GuestGate.module.css";

const BENEFITS = ["Free forever", "No credit card", "30-second setup"];

export interface GuestGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the guest was trying to do, e.g. "Tracking meals". */
  feature?: string;
}

export function GuestGate({ open, onOpenChange, feature }: GuestGateProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content} showCloseButton>
        <span className={styles.iconBadge} aria-hidden="true">
          <Lock />
        </span>
        <DialogTitle className={styles.title}>This feature needs an account</DialogTitle>
        <DialogDescription className={styles.body}>
          {feature ? `${feature}, ` : "Tracking meals, "}
          saving favorites, and personalized recommendations require a free account.
        </DialogDescription>

        <ul className={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <li key={benefit} className={styles.benefit}>
              <Check aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>

        <Link href={ROUTES.register}>
          <Button className={styles.primary}>Create Free Account</Button>
        </Link>

        <SocialAuthButtons dividerLabel="Or sign up with" />

        <button type="button" className={styles.dismiss} onClick={() => onOpenChange(false)}>
          Continue browsing
        </button>
      </DialogContent>
    </Dialog>
  );
}
