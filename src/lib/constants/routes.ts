export const ROUTES = {
  home: "/",
  about: "/about",
  login: "/login",
  register: "/register",
  verifyEmail: "/verify-email",
  accountReady: "/account-ready",
  emailVerified: "/email-verified",
  dashboard: "/dashboard",
  forgotPassword: "/forgot-password",
  forgotPasswordSent: "/forgot-password/sent",
  resetPassword: "/reset-password",
  resetPasswordDone: "/reset-password/done",
  onboarding: "/onboarding",
} as const;

/** Route prefixes that render without the site chrome (header/footer). */
export const BARE_ROUTE_PREFIXES = [
  "/onboarding",
  "/login",
  "/register",
  "/verify-email",
  "/account-ready",
  "/email-verified",
  "/forgot-password",
  "/reset-password",
] as const;
