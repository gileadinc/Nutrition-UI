import { isApiError } from "./ApiError";
import type { ApiErrorDetails } from "./types";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

function flattenDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as ApiErrorDetails;
  const parts: string[] = [];
  if (Array.isArray(d.formErrors)) parts.push(...d.formErrors);
  if (d.fieldErrors) {
    for (const messages of Object.values(d.fieldErrors)) {
      if (Array.isArray(messages)) parts.push(...messages);
    }
  }
  return parts.length ? parts.join(" ") : null;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const detail = flattenDetails(error.details);
    return detail ?? error.message;
  }
  if (error instanceof Error) return error.message || FALLBACK_MESSAGE;
  if (typeof error === "string") return error;
  return FALLBACK_MESSAGE;
}
