"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <div style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.375rem" }}>Something went wrong</h1>
          <p style={{ marginTop: "0.5rem" }}>The application encountered an unexpected error.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.625rem 1.25rem",
              border: "1px solid transparent",
              borderRadius: "8px",
              background: "#12a9a0",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
