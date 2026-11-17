"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthStatus, authStatusActionClasses } from "@/components/AuthStatus";
import { toast } from "sonner";
import { authApi, getErrorMessage } from "@/lib/api";
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
  const sentTo = searchParams.get("to") ?? searchParams.get("email");
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResending(true);
    try {
      if (sentTo) {
        await authApi.requestPasswordReset({
          channel: isPhone ? "phone" : "email",
          destination: sentTo,
        });
      }
      toast.success("Reset code sent again.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setResending(false);
    }
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
              {!isPhone ? (
                <Link
                  href={`${ROUTES.resetPassword}${sentTo ? `?email=${encodeURIComponent(sentTo)}` : ""}`}
                  className={authStatusActionClasses.link}
                >
                  Enter your code
                </Link>
              ) : null}
              <button
                type="button"
                className={authStatusActionClasses.link}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
              <Link href={ROUTES.login} className={authStatusActionClasses.mutedLink}>
                Back to sign in
              </Link>
            </>
          }
        >
          {isPhone
            ? "We have sent a secure password reset code by text message. Didn’t receive it? Check your signal or try resending."
            : "We have sent a password reset code to your registered email address. Enter it on the next screen to choose a new password. Didn’t receive it? Check your spam folder or try resending."}
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
