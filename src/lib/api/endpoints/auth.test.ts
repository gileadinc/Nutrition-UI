import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE = "https://api.example.test/dev/api";

function ok(data?: unknown) {
  return new Response(JSON.stringify({ success: true, message: "ok", data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function loadAuth() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  return import("./auth");
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url: String(url), method: init.method as string, body: JSON.parse(init.body as string) };
}

describe("auth endpoints against the backend contract", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("signs in at /api/auth/signin", async () => {
    fetchMock.mockResolvedValue(ok({ userId: "u1", email: "a@b.co", accessToken: "t", refreshToken: "r" }));
    const auth = await loadAuth();
    await auth.login({ email: "a@b.co", password: "pw" });
    expect(lastCall(fetchMock)).toMatchObject({
      url: `${BASE}/auth/signin`,
      method: "POST",
      body: { email: "a@b.co", password: "pw" },
    });
  });

  it("sign-up sends only fields the backend accepts (no phone)", async () => {
    fetchMock.mockResolvedValue(ok({ userId: "u1" }));
    const auth = await loadAuth();
    await auth.register({
      givenName: "Ada",
      familyName: "Lovelace",
      email: "a@b.co",
      password: "Passw0rd!",
      phone: "+15555550100",
    });
    const call = lastCall(fetchMock);
    expect(call.url).toBe(`${BASE}/auth/signup`);
    expect(call.body).toEqual({
      givenName: "Ada",
      familyName: "Lovelace",
      email: "a@b.co",
      password: "Passw0rd!",
    });
  });

  it("forgot-password posts { email }", async () => {
    fetchMock.mockResolvedValue(ok({}));
    const auth = await loadAuth();
    await auth.requestPasswordReset({ channel: "email", destination: "a@b.co" });
    expect(lastCall(fetchMock)).toMatchObject({
      url: `${BASE}/auth/forgot-password`,
      body: { email: "a@b.co" },
    });
  });

  it("rejects a phone reset without calling the backend", async () => {
    const auth = await loadAuth();
    await expect(
      auth.requestPasswordReset({ channel: "phone", destination: "+15555550100" }),
    ).rejects.toThrow(/isn’t available yet/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reset-password posts email, confirmationCode and newPassword", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "done" }), { status: 200 }),
    );
    const auth = await loadAuth();
    await expect(
      auth.resetPassword({ email: "a@b.co", code: "123456", password: "Passw0rd!" }),
    ).resolves.toEqual({ success: true });
    expect(lastCall(fetchMock)).toMatchObject({
      url: `${BASE}/auth/reset-password`,
      body: { email: "a@b.co", confirmationCode: "123456", newPassword: "Passw0rd!" },
    });
  });

  it("offers email-only recovery without a network call", async () => {
    const auth = await loadAuth();
    await expect(auth.getRecoveryOptions()).resolves.toEqual({ email: null, phone: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
