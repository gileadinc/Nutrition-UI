/**
 * Shared response models for the Nutrition backend. Nullable fields use
 * `| null` because the API returns explicit `null` for unset profile data.
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  servings: number;
  goalTags: string[];
  category: string;
  imageUrl: string;
  ingredients: string[];
  steps: string[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalTags: string[];
  swaps: string[];
  whatToOrder: string[];
  whyThisWorks: string;
  imageUrl: string;
}

export interface Restaurant {
  id: string;
  name: string;
  city: string;
  state: string;
  distanceMiles: number;
  latitude: number | null;
  longitude: number | null;
  category: string;
  bestForGoals: string[];
  summary: string;
  testedOrderCount: number;
  imageUrl: string;
  menuItems?: MenuItem[];
}

export interface FastHack {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  calories?: number;
  protein?: number;
  goalTags?: string[];
  imageUrl?: string;
  [key: string]: unknown;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl?: number;
}

export interface DailySummary {
  date: string;
  entryCount: number;
  totals: MacroTotals;
  targets: MacroTotals;
  remaining: MacroTotals;
  progressPercent: MacroTotals;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface NutritionEntry {
  entryId: string;
  ownerType: string;
  ownerId: string;
  loggedAt: string;
  mealType: MealType;
  sourceType: string | null;
  sourceItemId: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  waterMl: number | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type SavedItemType = "recipe" | "order" | "fast_hack" | string;

export interface SavedItem {
  savedItemId: string;
  itemType: SavedItemType;
  itemId: string;
  title: string;
  subtitle: string | null;
  createdAt: string | null;
}

export interface NotificationPrefs {
  enabled: boolean;
  mealReminders: boolean;
  goalUpdates: boolean;
  productUpdates?: boolean;
}

export interface PrivacyPrefs {
  analytics: boolean;
  personalizedRecommendations: boolean;
  locationServices?: boolean;
}

export interface Preferences {
  notifications: NotificationPrefs;
  privacy: PrivacyPrefs;
  nutritionTargets: MacroTotals;
}

export interface Profile {
  userId: string;
  email: string;
  displayName: string | null;
  givenName: string | null;
  familyName: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  unitsPreference: string | null;
  activityLevel: string | null;
  surgicalContext: string | null;
  dietaryPreferences: string[] | null;
  allergies: string[] | null;
  preferences: Preferences;
  lastLoginAt: string | null;
}

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface OnboardingSession {
  sessionId: string;
  status: string;
  currentStep: number;
  goal: string | null;
  dateOfBirth: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  unitsPreference: string | null;
  sex: string | null;
  surgicalContext: string | null;
  activityLevel: string | null;
  completedSteps: number[];
  isCompleted: boolean;
}

export interface QuickAction {
  key: string;
  label: string;
  requiresAccount?: boolean;
}

export interface GuestHome {
  greeting: string;
  promptTitle: string;
  featuredRecipes: Recipe[];
  featuredRestaurants: Restaurant[];
  quickActions: QuickAction[];
  suggestedSearches: string[];
}

export interface HomeFeed {
  greeting: string;
  goal: string | null;
  todayProgress: DailySummary;
  recommendations: {
    recipes: Recipe[];
    restaurants?: Restaurant[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
