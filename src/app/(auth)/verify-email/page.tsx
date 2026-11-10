"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ROUTES } from "@/lib/constants";
import styles from "../auth.module.css";

const RESEND_COOLDOWN_SECONDS = 30;
const STEPS = [
  "Open the email from ForkThis!",
  "Tap “Verify email” inside it",
  "You land back here, ready to set up your plan",
];

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
    <div className={styles.verifyPage}>
      <Logo />
      <span className={styles.verifyBadge} aria-hidden="true">
        <MailCheck size={26} strokeWidth={1.75} />
        <i />
      </span>
      <h1 className={styles.verifyHeading}>Check your inbox</h1>
      <p className={styles.verifyBody}>
        We sent a verification link to <strong>{email ?? "your email"}</strong>. Tap it to activate
        your account.
      </p>

      <ol className={styles.verifySteps}>
        {STEPS.map((step, i) => (
          <li key={step}>
            <span>{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      <a href="mailto:" className={styles.primaryLink}>
        Open email app
      </a>

      <p className={styles.verifyHelp}>Nothing yet? Check spam or promotions, or resend.</p>
      <button
        type="button"
        className={styles.resend}
        onClick={handleResend}
        disabled={resending || cooldown > 0}
      >
        {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
      </button>

      <div className={styles.verifyLinks}>
        <Link href={ROUTES.register}>Wrong email?</Link>
        <Link href={ROUTES.login}>Back to sign in</Link>
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
