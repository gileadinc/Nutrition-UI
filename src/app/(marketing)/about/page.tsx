import { Container } from "@/components/Container";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <Container>
      <section className={styles.section}>
        <p className={styles.badge}>Placeholder page</p>
        <h1 className={styles.heading}>About (placeholder)</h1>
        <p className={styles.body}>
          This route exists to demonstrate that routing works. Content will be replaced once product
          and UX direction are finalized.
        </p>
      </section>
    </Container>
  );
}
