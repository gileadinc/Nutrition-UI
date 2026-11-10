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

export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  email: string;
}

export function requestPasswordReset(
  payload: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  if (DEMO_MODE) {
    return demoDelay({ email: payload.email || "demo@forkthis.app" });
  }
  return apiClient.post("/auth/forgot-password", payload).then(() => ({ email: payload.email }));
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

/* -------------------------------------------------------------------------- */
/*  Social / hosted-UI OAuth                                                   */
/* -------------------------------------------------------------------------- */

export interface SocialAuthUrlResponse {
  provider: string;
  authorizeUrl: string;
}

export function googleAuthUrl(state: string): Promise<SocialAuthUrlResponse> {
  return apiClient.get<SocialAuthUrlResponse>(
    `/api/auth/oauth/google/url?state=${encodeURIComponent(state)}`,
  );
}

export interface OAuthExchangeRequest {
  code: string;
  redirectUri?: string;
}

export function exchangeOAuthCode(payload: OAuthExchangeRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/api/auth/oauth/exchange", payload).then((data) => {
    setTokens(data);
    return data;
  });
}
