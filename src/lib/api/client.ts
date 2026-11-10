import { ApiError } from "./ApiError";
import type { ApiEnvelope, ApiErrorEnvelope } from "./types";
import { getAccessToken } from "./tokenStore";

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

/** Reads both `{ error: { message } }` and the backend's flat `{ message, statusCode, details }` shapes. */
function readError(payload: ApiErrorEnvelope | { message?: string; statusCode?: number; details?: unknown }) {
  if ("error" in payload && payload.error) return payload.error;
  const flat = payload as { message?: string; statusCode?: number; details?: unknown };
  return {
    code: flat.statusCode ? String(flat.statusCode) : undefined,
    message: flat.message ?? "Something went wrong. Please try again.",
    details: flat.details,
  };
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
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
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

  if (!response.ok) {
    const errorBody = payload && !payload.success ? readError(payload) : undefined;
    throw new ApiError(errorBody?.message ?? `Request failed with status ${response.status}.`, {
      kind: "api",
      status: response.status,
      code: errorBody?.code,
      details: errorBody?.details,
    });
  }

  if (payload && payload.success === false) {
    const errorBody = readError(payload);
    throw new ApiError(errorBody.message, {
      kind: "api",
      status: response.status,
      code: errorBody.code,
      details: errorBody.details,
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
