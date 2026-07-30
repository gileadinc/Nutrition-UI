import Link from "next/link";
import { Card } from "@/components/Card";
import { TextInput } from "@/components/TextInput";
import { Checkbox } from "@/components/Checkbox";
import { Button } from "@/components/Button";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function RegisterPage() {
  return (
    <Card>
      <h1 className={styles.heading}>Create account (placeholder)</h1>
      <form className={styles.form}>
        <TextInput label="Name" type="text" name="name" autoComplete="name" />
        <TextInput label="Email" type="email" name="email" autoComplete="email" />
        <TextInput label="Password" type="password" name="password" autoComplete="new-password" />
        <Checkbox label="I agree to the placeholder terms" name="agree" />
        <Button type="submit" className={styles.submit}>
          Placeholder submit
        </Button>
      </form>
      <p className={styles.footer}>
        Already have an account? <Link href={ROUTES.login}>Log in</Link>
      </p>
    </Card>
  );
}
