import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./page.module.css";

export default function Home() {
  return (
    <Container>
      <section className={styles.hero}>
        <p className={styles.badge}>Placeholder content — not final branding</p>
        <h1 className={styles.heading}>Nutrition (placeholder product name)</h1>
        <p className={styles.subheading}>
          This is a temporary landing page shell used to demonstrate that the web foundation,
          routing, responsive layout, and deployment pipeline are working end to end. Copy, imagery,
          and visual design will be replaced once the UX direction is finalized.
        </p>
        <div className={styles.actions}>
          <Button variant="primary">Placeholder call to action</Button>
          <Link href="/about">
            <Button variant="outline">Learn more</Button>
          </Link>
        </div>
      </section>

      <section className={styles.cards} aria-label="Placeholder feature highlights">
        <Card>
          <h2 className={styles.cardTitle}>Placeholder feature one</h2>
          <p className={styles.cardBody}>
            Short placeholder description of a future product feature goes here.
          </p>
        </Card>
        <Card>
          <h2 className={styles.cardTitle}>Placeholder feature two</h2>
          <p className={styles.cardBody}>
            Short placeholder description of a future product feature goes here.
          </p>
        </Card>
        <Card>
          <h2 className={styles.cardTitle}>Placeholder feature three</h2>
          <p className={styles.cardBody}>
            Short placeholder description of a future product feature goes here.
          </p>
        </Card>
      </section>
    </Container>
  );
}
