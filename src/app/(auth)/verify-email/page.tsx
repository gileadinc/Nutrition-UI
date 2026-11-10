"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import styles from "../auth.module.css";

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
    <div className={styles.verify}>
      <div className={styles.verifyTop}>
        <span className={styles.verifyIcon} aria-hidden="true">
          <MailCheck size={67} strokeWidth={1.5} />
        </span>
        <h1 className={styles.verifyTitle}>Check your inbox</h1>
        <p className={styles.verifyBody}>
          We sent a verification link to <strong>{email ?? "your email address"}</strong>. Tap it
          to activate your account.
        </p>
      </div>

      <div>
        <p className={styles.resendPrompt}>Didn&apos;t receive the email?</p>
        <button
          type="button"
          className={styles.resend}
          onClick={handleResend}
          disabled={resending || cooldown > 0}
        >
          {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </button>
        <Link href={ROUTES.login} className={styles.verifyBack}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
