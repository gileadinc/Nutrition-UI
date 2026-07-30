import Link from "next/link";
import { Container } from "@/components/Container";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/Button";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <Container>
      <ErrorState
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={
          <Link href={ROUTES.home}>
            <Button variant="outline">Back to home</Button>
          </Link>
        }
      />
    </Container>
  );
}
