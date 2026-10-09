export {
  getSession,
  setSession,
  clearSession,
  isAuthenticated,
  subscribe,
  authHeader,
} from "./session";
export type { AuthSession, SignInTokens } from "./session";
export { useSession } from "./useSession";
export {
  getGuestSessionId,
  setGuestSessionId,
  clearGuestSessionId,
  ensureGuestSession,
} from "./guest";
export { migrateGuestProgress } from "./migrate";
export {
  startSocialSignIn,
  consumePendingSocialSignIn,
  SOCIAL_PROVIDER_LABEL,
  OAUTH_CALLBACK_PATH,
  APPLE_SIGN_IN_ENABLED,
} from "./social";
export type { SocialProvider, PendingResult } from "./social";
