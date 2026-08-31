import { apiClient } from "../client";

/**
 * Auth endpoints for the Nutrition backend (tag: `auth`).
 * Base URL comes from NEXT_PUBLIC_API_BASE_URL (see .env.example). The dev
 * deployment is https://exg1uor80g.execute-api.us-east-1.amazonaws.com/dev.
 *
 * Every call returns the unwrapped `data` from the `{ success, message, data }`
 * envelope; the client throws an ApiError for `success: false` / non-2xx.
 */

/* -------------------------------------------------------------------------- */
/*  POST /api/auth/signup                                                      */
/* -------------------------------------------------------------------------- */

export interface SignUpRequest {
  email: string;
  password: string;
  givenName?: string;
  familyName?: string;
}

export interface SignUpResponse {
  userId: string;
  userConfirmed: boolean;
  codeDelivery: {
    destination?: string;
    deliveryMedium?: string;
    attributeName?: string;
  } | null;
}

export function signUp(payload: SignUpRequest): Promise<SignUpResponse> {
  return apiClient.post<SignUpResponse>("/api/auth/signup", payload);
}

/* -------------------------------------------------------------------------- */
/*  POST /api/auth/signin                                                      */
/* -------------------------------------------------------------------------- */

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  challengeName: string | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string | null;
  userId: string | null;
  email: string | null;
  userProvisioned: boolean | null;
}

export function signIn(payload: SignInRequest): Promise<SignInResponse> {
  return apiClient.post<SignInResponse>("/api/auth/signin", payload);
}

/* -------------------------------------------------------------------------- */
/*  POST /api/auth/forgot-password                                             */
/* -------------------------------------------------------------------------- */

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  destination?: string;
  deliveryMedium?: string;
  attributeName?: string;
}

export function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse | null> {
  return apiClient.post<ForgotPasswordResponse | null>("/api/auth/forgot-password", payload);
}

/* -------------------------------------------------------------------------- */
/*  POST /api/auth/reset-password                                             */
/* -------------------------------------------------------------------------- */

export interface ResetPasswordRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export function resetPassword(payload: ResetPasswordRequest): Promise<null> {
  return apiClient.post<null>("/api/auth/reset-password", payload);
}

/* -------------------------------------------------------------------------- */
/*  POST /api/auth/refresh                                                     */
/* -------------------------------------------------------------------------- */

export interface RefreshRequest {
  refreshToken: string;
  email?: string;
}

export function refresh(payload: RefreshRequest): Promise<SignInResponse> {
  return apiClient.post<SignInResponse>("/api/auth/refresh", payload);
}

/* -------------------------------------------------------------------------- */
/*  POST /api/auth/signout                                                     */
/* -------------------------------------------------------------------------- */

export interface SignOutRequest {
  accessToken?: string;
  refreshToken?: string;
}

export function signOut(payload: SignOutRequest = {}): Promise<null> {
  return apiClient.post<null>("/api/auth/signout", payload);
}

/* -------------------------------------------------------------------------- */
/*  Guest sessions                                                             */
/* -------------------------------------------------------------------------- */

export interface GuestSessionResponse {
  sessionId: string;
  createdAt: string;
  expiresAt: string | null;
  mode: string;
}

export function createGuestSession(): Promise<GuestSessionResponse> {
  return apiClient.post<GuestSessionResponse>("/api/auth/guest/session");
}

export interface GuestMigrateRequest {
  sessionId: string;
}

export function migrateGuest(payload: GuestMigrateRequest): Promise<unknown> {
  return apiClient.post<unknown>("/api/auth/guest/migrate", payload);
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

export function appleAuthUrl(state: string): Promise<SocialAuthUrlResponse> {
  return apiClient.get<SocialAuthUrlResponse>(
    `/api/auth/oauth/apple/url?state=${encodeURIComponent(state)}`,
  );
}

export interface OAuthExchangeRequest {
  code: string;
  redirectUri?: string;
}

export function exchangeOAuthCode(payload: OAuthExchangeRequest): Promise<SignInResponse> {
  return apiClient.post<SignInResponse>("/api/auth/oauth/exchange", payload);
}
