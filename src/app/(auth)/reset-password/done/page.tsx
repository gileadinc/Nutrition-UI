import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthStatus, authStatusActionClasses } from "@/components/AuthStatus";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Password updated — ForkThis!",
};

export default function ResetPasswordDonePage() {
  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthStatus
          icon={<ShieldCheck />}
          tone="success"
          heading="Password updated"
          actions={
            <>
              <Link href={ROUTES.login} className={styles.primaryLink}>
                <Button className={authStatusActionClasses.primary}>Sign in</Button>
              </Link>
              <Link href={ROUTES.dashboard} className={authStatusActionClasses.mutedLink}>
                Or continue as Guest
              </Link>
            </>
          }
        >
          Your password has been successfully reset. You can now sign in with your
          new password.
        </AuthStatus>
      </CardContent>
    </Card>
  );
}
