import { apiClient } from "../client";

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
  userId: string;
  email: string;
}

export function login(payload: LoginRequest): Promise<LoginResponse> {
  if (DEMO_MODE) {
    return demoDelay({
      userId: "demo-user",
      email: payload.email || "demo@forkthis.app",
    });
  }
  return apiClient.post<LoginResponse>("/auth/login", payload);
}

export interface RegisterRequest {
  name: string;
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
  return apiClient.post<RegisterResponse>("/auth/register", payload);
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
  return apiClient.post<RequestPasswordResetResponse>("/auth/password/reset-request", payload);
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
