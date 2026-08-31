export const ROUTES = {
  home: "/",
  about: "/about",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  resetPasswordDone: "/reset-password/done",
  oauthCallback: "/auth/callback",
  ageGate: "/age-gate",
  guestHome: "/discover",
  recipes: "/recipes",
  recipe: (id: string) => `/recipes/${id}`,
  eatOut: "/eat-out",
  restaurant: (id: string) => `/eat-out/restaurants/${id}`,
  menuItem: (id: string) => `/eat-out/menu-items/${id}`,
  fastHack: (id: string) => `/eat-out/fast-hacks/${id}`,
  track: "/track",
  saved: "/saved",
  settings: "/settings",
  onboarding: {
    welcome: "/onboarding/welcome",
    goals: "/onboarding/goals",
    basics: "/onboarding/basics",
    health: "/onboarding/health",
  },
} as const;

/** Route prefixes that render without the site chrome (header/footer). */
export const BARE_ROUTE_PREFIXES = ["/onboarding"] as const;
