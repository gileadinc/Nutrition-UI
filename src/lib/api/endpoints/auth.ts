import { apiClient } from "../client";
import { setTokens } from "../tokenStore";

/**
 * Demo mode: when no API base URL is configured, the auth endpoints resolve
 * with a mocked success response instead of hitting a backend. This keeps the
 * login / register / verify flows walkable end to end for demos. Set
 * NEXT_PUBLIC_API_BASE_URL to use the real API.
 */
const DEMO_MODE = !process.env.NEXT_PUBLIC_API_BASE_URL;

function demoDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 500));
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string | null;
  email: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export function login(payload: LoginRequest): Promise<LoginResponse> {
  if (DEMO_MODE) {
    return demoDelay({
      userId: "demo-user",
      email: payload.email || "demo@forkthis.app",
      accessToken: null,
      refreshToken: null,
    });
  }
  return apiClient.post<LoginResponse>("/auth/signin", payload).then((data) => {
    setTokens(data);
    return data;
  });
}

export interface RegisterRequest {
  givenName: string;
  familyName?: string;
  email: string;
  password: string;
  /** Optional, for account recovery when email is unavailable. */
  phone?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
}

export function register(payload: RegisterRequest): Promise<RegisterResponse> {
  if (DEMO_MODE) {
    return demoDelay({
      userId: "demo-user",
      email: payload.email || "demo@forkthis.app",
    });
  }
  return apiClient
    .post<{ userId: string }>("/auth/signup", payload)
    .then((data) => ({ userId: data.userId, email: payload.email }));
}

/** Where a reset link or code is sent. */
export type ResetChannel = "email" | "phone";

export interface RequestPasswordResetRequest {
  channel: ResetChannel;
  /** The email or phone number, depending on `channel`. */
  destination: string;
}

export interface RequestPasswordResetResponse {
  channel: ResetChannel;
  destination: string;
}

export function requestPasswordReset(
  payload: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  const destination =
    payload.destination || (payload.channel === "phone" ? "+1 (555) 010-0000" : "demo@forkthis.app");
  if (DEMO_MODE) {
    return demoDelay({ channel: payload.channel, destination });
  }
  return apiClient
    .post("/auth/forgot-password", payload)
    .then(() => ({ channel: payload.channel, destination }));
}

export interface RecoveryOptions {
  email: string | null;
  /** Masked for display, e.g. "+1 (•••) •••-4821". Null when none is on file. */
  phone: string | null;
}

/**
 * What the account can be recovered through. The reset screen shows only the
 * channels that are actually on the profile.
 */
export function getRecoveryOptions(): Promise<RecoveryOptions> {
  if (DEMO_MODE) {
    return demoDelay({ email: "demo@forkthis.app", phone: "+1 (•••) •••-4821" });
  }
  return apiClient.get<RecoveryOptions>("/auth/recovery-options");
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: true;
}

export function resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  if (DEMO_MODE) {
    return demoDelay({ success: true as const });
  }
  return apiClient.post<ResetPasswordResponse>("/auth/password/reset", payload);
}
