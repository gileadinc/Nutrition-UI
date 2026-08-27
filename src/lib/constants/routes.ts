export const ROUTES = {
  home: "/",
  about: "/about",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  onboarding: {
    welcome: "/onboarding/welcome",
    goals: "/onboarding/goals",
    basics: "/onboarding/basics",
    health: "/onboarding/health",
  },
} as const;

/** Route prefixes that render without the site chrome (header/footer). */
export const BARE_ROUTE_PREFIXES = ["/onboarding"] as const;
