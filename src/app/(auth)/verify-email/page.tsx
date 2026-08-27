"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

const RESEND_COOLDOWN_SECONDS = 30;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    // TODO: call the real resend-verification endpoint once available.
    setResending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setResending(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success("Verification email sent again.");
  }

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <span className={styles.iconBadge} aria-hidden="true">
          <MailCheck />
        </span>
        <h1 className={styles.heading}>Verify your email</h1>
        <p className={styles.message}>
          We&apos;ve sent a verification link to
        </p>
        <span className={styles.email}>{email ?? "your email address"}</span>
        <p className={styles.hint}>
          Open it and tap the link to finish setting up your ForkThis! account.
          The link expires in 30 minutes.
        </p>

        <div className={styles.actions}>
          <Button
            type="button"
            className={styles.resend}
            onClick={handleResend}
            disabled={resending || cooldown > 0}
          >
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend email"}
          </Button>

          <p className={styles.spam}>
            Can&apos;t find it? Check your spam or promotions folder.
          </p>
        </div>

        <div className={styles.footer}>
          <Link href={ROUTES.register} className={styles.footerLink}>
            Wrong address?
          </Link>
          <span className={styles.footerDivider} aria-hidden="true" />
          <Link href={ROUTES.login} className={styles.footerLink}>
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
