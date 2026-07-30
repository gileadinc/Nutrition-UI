import { ReactNode } from "react";
import { Container } from "@/components/Container";
import styles from "./layout.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Container className={styles.wrapper}>
      <div className={styles.panel}>{children}</div>
    </Container>
  );
}
