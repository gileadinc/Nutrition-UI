"use client";

import { useEffect } from "react";
import { Container } from "@/components/Container";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/Button";
import { getErrorMessage } from "@/lib/api";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container>
      <ErrorState
        title="Something went wrong"
        description={getErrorMessage(error)}
        action={
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
        }
      />
    </Container>
  );
}
