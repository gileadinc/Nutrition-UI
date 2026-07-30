import { useId } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { TextField } from "@/components/TextField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function RegisterPage() {
  const agreeId = useId();

  return (
    <Card className="py-8">
      <CardContent className="px-8">
        <h1 className={styles.heading}>Create account (placeholder)</h1>
        <form className={styles.form}>
          <TextField label="Name" type="text" name="name" autoComplete="name" />
          <TextField label="Email" type="email" name="email" autoComplete="email" />
          <TextField label="Password" type="password" name="password" autoComplete="new-password" />
          <div className="flex items-center gap-2">
            <Checkbox id={agreeId} name="agree" />
            <Label htmlFor={agreeId}>I agree to the placeholder terms</Label>
          </div>
          <Button type="submit" className={styles.submit}>
            Placeholder submit
          </Button>
        </form>
        <p className={styles.footer}>
          Already have an account? <Link href={ROUTES.login}>Log in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
