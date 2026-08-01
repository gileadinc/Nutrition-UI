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
