import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Lock, Shield } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Welcome — ForkThis!",
};

export default function WelcomePage() {
  return (
    <>
      <h1 className={styles.welcomeTitle} style={{ paddingTop: "3.75rem" }}>
        The first step toward a healthier you starts here.
      </h1>
      <p className={styles.welcomeBody}>
        ForkThis! bring everything you need to support a healthier lifestyle into one simple place,
        so you can spend less time figuring it out and more time making progress.
      </p>
      <div className={styles.welcomeActions}>
        <Link href={ROUTES.onboarding} className={styles.primaryLink}>
          Create a free account
        </Link>
        <Link href={ROUTES.login} className={styles.outlineLink}>
          Sign in
        </Link>
        <Link href={ROUTES.dashboard} className={styles.guestLink}>
          Continue as guest
        </Link>
      </div>
      <div className={styles.trust}>
        <span>
          <Shield size={24} aria-hidden="true" /> Secure
        </span>
        <span>
          <Lock size={24} aria-hidden="true" /> No credit card
        </span>
        <span>
          <ListChecks size={24} aria-hidden="true" /> 2 min setup
        </span>
      </div>
    </>
  );
}
