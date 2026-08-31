import { ApiError } from "./ApiError";
import type { ApiEnvelope } from "./types";

const DEFAULT_TIMEOUT_MS = 15000;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
}

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = getBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", {
        kind: "timeout",
        cause,
      });
    }
    throw new ApiError("Unable to reach the server. Check your connection and try again.", {
      kind: "network",
      cause,
    });
  } finally {
    clearTimeout(timeout);
  }

  let payload: ApiEnvelope<T> | undefined;
  const rawText = await response.text();
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiEnvelope<T>;
    } catch (cause) {
      if (response.ok) {
        throw new ApiError("Received an unexpected response from the server.", {
          kind: "parse",
          status: response.status,
          cause,
        });
      }
      // Non-2xx responses aren't guaranteed to return JSON (proxies, load balancers,
      // unhandled server errors) — fall through to the status-based ApiError below.
    }
  }

  if (payload && payload.success === false) {
    // Backend error envelope: { success: false, message, statusCode, details? }.
    // Older mock responses used a nested { error: { code, message, details } }.
    const legacy = payload.error;
    throw new ApiError(legacy?.message ?? payload.message ?? `Request failed with status ${response.status}.`, {
      kind: "api",
      status: payload.statusCode ?? response.status,
      code: legacy?.code,
      details: legacy?.details ?? payload.details,
    });
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}.`, {
      kind: "api",
      status: response.status,
    });
  }

  if (payload && payload.success === true) {
    return payload.data;
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export interface RawResponse {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  /** Parsed JSON body when available, otherwise the raw text. */
  body: unknown;
}

/**
 * Fire a request and return the full response (status + parsed body) instead of
 * unwrapping the envelope or throwing on non-2xx. Used by the API playground so
 * every outcome — including 4xx/5xx — can be inspected in the UI.
 */
export async function rawRequest(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<RawResponse> {
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", { kind: "timeout", cause });
    }
    throw new ApiError("Unable to reach the server. Check your connection and try again.", {
      kind: "network",
      cause,
    });
  } finally {
    clearTimeout(timeout);
  }

  const durationMs = Math.round(performance.now() - startedAt);
  const rawText = await response.text();
  let parsed: unknown = rawText;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // keep raw text
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    durationMs,
    body: parsed,
  };
}
