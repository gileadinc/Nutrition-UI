/** App routes (mirrors the deployed ForkThis router). */
export const ROUTES = {
  splash: "/",
  welcome: "/welcome",
  onboarding: "/onboarding",
  questionnaire: "/questionnaire",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  verificationSent: "/verification-sent",
  resetLinkSent: "/reset-link-sent",
  passwordResetSuccess: "/password-reset-success",
  emailVerified: "/email-verified",
  home: "/home",
  guest: "/guest",
  fastHacks: "/fast-hacks",
  hack: (id: string) => `/hack/${id}`,
  search: (params?: { q?: string; scope?: "all" | "recipes" | "hacks" }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.scope) qs.set("scope", params.scope);
    const s = qs.toString();
    return s ? `/search?${s}` : "/search";
  },
  recipes: "/recipes",
  recipe: (id: string) => `/recipes/${id}`,
  recipeIngredients: (id: string) => `/recipes/${id}/ingredients`,
  recipeCook: (id: string) => `/recipes/${id}/cook`,
  recipeCookComplete: (id: string) => `/recipes/${id}/cook/complete`,
  track: "/track",
  trackInsights: "/track/insights",
  trackMeals: "/track/meals",
  trackWaterHistory: "/track/water/history",
  logMeal: "/track/log-meal",
  logMealCustom: "/track/log-meal/custom",
  logWater: "/track/water",
  logError: (type: string) => `/track/log-error/${type}`,
  you: "/you",
  personalDetails: "/you/personal-details",
  dietaryPreferences: "/you/dietary-preferences",
  saved: "/you/saved",
  legal: (document: string) => `/you/legal/${document}`,
  notifications: "/you/notifications",
  helpSupport: "/you/help-support",
  moduleState: (module: string, state: string) => `/state/${module}/${state}`,
} as const;
