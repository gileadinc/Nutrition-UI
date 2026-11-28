import { afterEach, describe, expect, it, vi } from "vitest";
import { BetaSignupError, submitBetaSignup } from "./submit";

const DATA = {
  firstName: " Ada ",
  lastName: "Lovelace",
  email: "ada@x.com",
  phone: "+1555",
  source: "friend",
};
const URL = "https://creva.test/form";
const ok = () => new Response("{}", { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("submitBetaSignup", () => {
  it("posts to Creva with its field names", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal("fetch", fetchMock);
    await submitBetaSignup(DATA, URL);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(URL);
    expect(JSON.parse(init.body)).toEqual({
      firstname: "Ada",
      lastname: "Lovelace",
      emailaddress: "ada@x.com",
      phonenumber: "+1555",
      howdidyouhearaboutus: "ForkThis beta — friend",
    });
  });

  it("always sends a non-empty how-did-you-hear value (Creva requires it)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal("fetch", fetchMock);
    await submitBetaSignup({ ...DATA, source: "" }, URL);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).howdidyouhearaboutus).toBe("ForkThis beta");
  });

  it("reports a rejected request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));
    await expect(submitBetaSignup(DATA, URL)).rejects.toBeInstanceOf(BetaSignupError);
  });

  it("reports a network/CORS failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("cors")));
    await expect(submitBetaSignup(DATA, URL)).rejects.toThrow(/reach the server/);
  });
});
