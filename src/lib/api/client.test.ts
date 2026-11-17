import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { isApiError } from "./ApiError";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns unwrapped data on a successful envelope response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { id: 1 } }));

    const result = await apiClient.get<{ id: number }>("/things/1");

    expect(result).toEqual({ id: 1 });
  });

  it("sends a JSON body and Content-Type header on POST", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { id: 2 } }));

    await apiClient.post("/things", { name: "New thing" });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "New thing" }));
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("throws an ApiError with the envelope's message on a success:false envelope", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false, error: { code: "NOT_FOUND", message: "Thing not found" } }),
    );

    await expect(apiClient.get("/things/999")).rejects.toMatchObject({
      name: "ApiError",
      message: "Thing not found",
      code: "NOT_FOUND",
    });
  });

  it("reads the backend's flat error shape on a non-2xx response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false, message: "Incorrect username or password.", statusCode: 401 }, 401),
    );

    await expect(apiClient.post("/auth/signin", {})).rejects.toMatchObject({
      message: "Incorrect username or password.",
      status: 401,
    });
  });

  it("throws an ApiError on a non-2xx status without an envelope", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("Internal Server Error", { status: 500 }));

    try {
      await apiClient.get("/things");
      expect.unreachable("expected apiClient.get to throw");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      if (isApiError(error)) {
        expect(error.status).toBe(500);
        expect(error.kind).toBe("api");
      }
    }
  });

  it("throws a network ApiError when fetch rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    try {
      await apiClient.get("/things");
      expect.unreachable("expected apiClient.get to throw");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      if (isApiError(error)) {
        expect(error.kind).toBe("network");
      }
    }
  });

  it("throws a timeout ApiError when the request is aborted", async () => {
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((_, reject) => {
          reject(new DOMException("Aborted", "AbortError"));
        }),
    );

    try {
      await apiClient.get("/things", { timeoutMs: 5 });
      expect.unreachable("expected apiClient.get to throw");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      if (isApiError(error)) {
        expect(error.kind).toBe("timeout");
      }
    }
  });
});

describe("buildUrl base/path joining", () => {
  const original = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: null }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_API_BASE_URL = original;
  });

  const calledUrl = () => String(vi.mocked(fetch).mock.calls[0][0]);

  it("appends the path when the base has no /api suffix", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/dev";

    await apiClient.post("/api/auth/signin", {});

    expect(calledUrl()).toBe("https://example.com/dev/api/auth/signin");
  });

  it("does not double /api when the base already ends in /api", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/dev/api";

    await apiClient.post("/api/auth/signin", {});

    expect(calledUrl()).toBe("https://example.com/dev/api/auth/signin");
  });

  it("trims trailing slashes on the base", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/dev/api/";

    await apiClient.post("/api/auth/signin", {});

    expect(calledUrl()).toBe("https://example.com/dev/api/auth/signin");
  });

  it("leaves non-/api paths alone when the base ends in /api", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/dev/api";

    await apiClient.get("/health");

    expect(calledUrl()).toBe("https://example.com/dev/api/health");
  });

  it("does not strip an /api path segment that merely starts with api", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/dev/api";

    await apiClient.get("/apiary/1");

    expect(calledUrl()).toBe("https://example.com/dev/api/apiary/1");
  });

  it("passes absolute URLs through untouched", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/dev/api";

    await apiClient.get("https://other.test/api/auth/signin");

    expect(calledUrl()).toBe("https://other.test/api/auth/signin");
  });
});
