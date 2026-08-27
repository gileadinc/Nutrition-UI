import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "You're in — ForkThis!",
};

export default function AccountReadyPage() {
  return (
    <Card className={styles.card}>
      <div className={styles.media} role="presentation" />
      <CardContent className={styles.cardContent}>
        <h1 className={styles.heading}>Welcome to ForkThis!</h1>
        <p className={styles.body}>
          Your personalized healthy culinary companion is ready. Let&apos;s customize your fitness
          goals and start cooking smarter today.
        </p>
        <Link href={ROUTES.onboarding.welcome} className={styles.cta}>
          <Button className={styles.ctaButton}>Get started</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
