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
  const email = searchParams.get("email") ?? "your registered email address";
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setResending(false);
    toast.success("Reset link sent again.");
  }

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthStatus
          icon={<Check />}
          tone="success"
          heading="Check your email"
          highlight={email}
          actions={
            <>
              <button
                type="button"
                className={authStatusActionClasses.link}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Sending..." : "Resend email"}
              </button>
              <Link href={ROUTES.login} className={authStatusActionClasses.mutedLink}>
                Back to sign in
              </Link>
            </>
          }
        >
          We have sent a secure password reset link to your registered email
          address. Didn&apos;t receive it? Check your spam folder or try resending.
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
