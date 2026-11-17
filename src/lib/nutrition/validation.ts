/** Very small email sanity check (the server is the source of truth). */
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const PASSWORD_HINT = "Use at least 8 characters.";

/** Returns an error message or undefined when the password is acceptable. */
export const validatePassword = (value: string): string | undefined =>
  value.length >= 8 ? undefined : PASSWORD_HINT;
