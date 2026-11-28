/**
 * Beta-tester sign-up collection.
 *
 * The backend is untouched: the landing page only collects beta interest and posts it to the
 * Creva lead form (`POST …/api/form/create`). Override the URL with `NEXT_PUBLIC_CREVA_FORM_URL`.
 * Production origins must be on that endpoint's CORS allow-list, and it requires every field below
 * to be non-empty.
 */

export interface BetaSignup {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** How the person heard about ForkThis (free text, optional in the form). */
  source?: string;
}

export const DEFAULT_CREVA_FORM_URL =
  "https://0kjogfestg.execute-api.us-east-1.amazonaws.com/prod/api/form/create";

export class BetaSignupError extends Error {}

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Sends the sign-up. Throws `BetaSignupError` with a user-presentable message on failure. */
export async function submitBetaSignup(
  data: BetaSignup,
  url: string = process.env.NEXT_PUBLIC_CREVA_FORM_URL || DEFAULT_CREVA_FORM_URL,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        firstname: clean(data.firstName),
        lastname: clean(data.lastName),
        emailaddress: clean(data.email),
        phonenumber: clean(data.phone),
        howdidyouhearaboutus: ["ForkThis beta", clean(data.source)].filter(Boolean).join(" — "),
      }),
    });
  } catch {
    // Network failure, or the page's origin isn't on the endpoint's CORS allow-list.
    throw new BetaSignupError("Couldn’t reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new BetaSignupError("Something went wrong sending your details. Please try again.");
  }
}
