import { isApiError } from "./ApiError";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message || FALLBACK_MESSAGE;
  if (typeof error === "string") return error;
  return FALLBACK_MESSAGE;
}
