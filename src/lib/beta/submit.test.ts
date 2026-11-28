import { afterEach, describe, expect, it, vi } from "vitest";
import { BetaSignupError, submitBetaSignup } from "./submit";

const DATA = {
  firstName: " Ada ",
  lastName: "Lovelace",
  email: "ada@x.com",
  phone: "",
  source: "friend",
};
const OK = () => new Response(JSON.stringify({ success: true }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("submitBetaSignup", () => {
  it("fails without an access key and never calls the network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(submitBetaSignup(DATA, {})).rejects.toBeInstanceOf(BetaSignupError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts trimmed details to Web3Forms", async () => {
    const fetchMock = vi.fn().mockResolvedValue(OK());
    vi.stubGlobal("fetch", fetchMock);
    await submitBetaSignup(DATA, { accessKey: "key" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.web3forms.com/submit");
    expect(JSON.parse(init.body)).toMatchObject({
      access_key: "key",
      name: "Ada Lovelace",
      email: "ada@x.com",
    });
  });

  it("surfaces a provider rejection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));
    await expect(submitBetaSignup(DATA, { accessKey: "key" })).rejects.toBeInstanceOf(
      BetaSignupError,
    );
  });

  it("surfaces a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(submitBetaSignup(DATA, { accessKey: "key" })).rejects.toThrow(/connection/);
  });

  it("mirrors to Creva with its field names, and ignores Creva failures", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(OK())
      .mockRejectedValueOnce(new TypeError("cors"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      submitBetaSignup(DATA, { accessKey: "key", crevaUrl: "https://creva.test/form" }),
    ).resolves.toBeUndefined();
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body).toEqual({
      firstname: "Ada",
      lastname: "Lovelace",
      emailaddress: "ada@x.com",
      phonenumber: "",
      howdidyouhearaboutus: "ForkThis beta — friend",
    });
  });
});
