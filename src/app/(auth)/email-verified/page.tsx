import type { Metadata } from "next";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthStatus, authStatusActionClasses } from "@/components/AuthStatus";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "You're all set — ForkThis!",
};

export default function EmailVerifiedPage() {
  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthStatus
          icon={<PartyPopper />}
          tone="success"
          heading="You're all set!"
          actions={
            <Link href={ROUTES.dashboard} className={styles.primaryLink}>
              <Button className={authStatusActionClasses.primary}>Get started</Button>
            </Link>
          }
        >
          Your email has been verified and your account is ready to go. Let&apos;s
          configure your dietary goals.
        </AuthStatus>
      </CardContent>
    </Card>
  );
}
