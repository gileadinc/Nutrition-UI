"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthStatus, authStatusActionClasses } from "@/components/AuthStatus";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

function SentContent() {
  const searchParams = useSearchParams();
  const isPhone = searchParams.get("channel") === "phone";
  // `email` is the legacy param name, kept so older links still read correctly.
  const destination =
    searchParams.get("to") ??
    searchParams.get("email") ??
    (isPhone ? "the number on your account" : "your registered email address");
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setResending(false);
    toast.success(isPhone ? "Reset code sent again." : "Reset link sent again.");
  }

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthStatus
          icon={<Check />}
          tone="success"
          heading={isPhone ? "Check your phone" : "Check your email"}
          highlight={destination}
          actions={
            <>
              <button
                type="button"
                className={authStatusActionClasses.link}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Sending..." : isPhone ? "Resend code" : "Resend email"}
              </button>
              <Link href={ROUTES.login} className={authStatusActionClasses.mutedLink}>
                Back to sign in
              </Link>
            </>
          }
        >
          {isPhone
            ? "We have sent a secure password reset code by text message. Didn’t receive it? Check your signal or try resending."
            : "We have sent a secure password reset link to your registered email address. Didn’t receive it? Check your spam folder or try resending."}
        </AuthStatus>
      </CardContent>
    </Card>
  );
}

export default function ResetLinkSentPage() {
  return (
    <Suspense fallback={null}>
      <SentContent />
    </Suspense>
  );
}
