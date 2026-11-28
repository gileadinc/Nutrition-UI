/**
 * Beta-tester sign-up collection.
 *
 * The backend is untouched: the landing page only collects beta interest. Submissions go to
 * Web3Forms (primary, emails the team). Optionally they are mirrored, best-effort, to the Creva
 * lead-form endpoint (`POST …/api/form/create`) — that needs the ForkThis origins added to its CORS
 * allow-list first, so it stays off until `NEXT_PUBLIC_CREVA_FORM_URL` is set.
 */

export interface BetaSignup {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** How the person heard about ForkThis (free text, optional). */
  source?: string;
}

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

export class BetaSignupError extends Error {}

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Mirror to Creva's lead form (field names are theirs). Failures are swallowed: Web3Forms is the source of truth. */
async function mirrorToCreva(url: string, data: BetaSignup): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstname: clean(data.firstName),
        lastname: clean(data.lastName),
        emailaddress: clean(data.email),
        phonenumber: clean(data.phone),
        howdidyouhearaboutus: ["ForkThis beta", clean(data.source)].filter(Boolean).join(" — "),
      }),
    });
  } catch {
    // CORS not yet allowed or network error — ignore.
  }
}

/** Sends the sign-up. Throws `BetaSignupError` with a user-presentable message on failure. */
export async function submitBetaSignup(
  data: BetaSignup,
  opts: { accessKey?: string; crevaUrl?: string } = {
    accessKey: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
    crevaUrl: process.env.NEXT_PUBLIC_CREVA_FORM_URL,
  },
): Promise<void> {
  if (!opts.accessKey) {
    throw new BetaSignupError("Beta sign-up isn’t available right now. Please try again soon.");
  }

  let response: Response;
  try {
    response = await fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: opts.accessKey,
        subject: "New ForkThis beta tester",
        from_name: "ForkThis beta sign-up",
        name: `${clean(data.firstName)} ${clean(data.lastName)}`.trim(),
        email: clean(data.email),
        phone: clean(data.phone),
        source: clean(data.source),
      }),
    });
  } catch {
    throw new BetaSignupError("Couldn’t reach the server. Check your connection and try again.");
  }

  const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
  if (!response.ok || !result?.success) {
    throw new BetaSignupError("Something went wrong sending your details. Please try again.");
  }

  if (opts.crevaUrl) await mirrorToCreva(opts.crevaUrl, data);
}
