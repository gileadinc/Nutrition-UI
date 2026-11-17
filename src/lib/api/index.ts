export { apiClient, rawRequest } from "./client";
export type { RequestOptions, RawResponse } from "./client";
export { ApiError, isApiError } from "./ApiError";
export type { ApiErrorKind, ApiErrorOptions } from "./ApiError";
export { getErrorMessage } from "./getErrorMessage";
export type {
  ApiEnvelope,
  ApiSuccessEnvelope,
  ApiErrorEnvelope,
  ApiErrorBody,
  ApiErrorDetails,
} from "./types";

export * from "./models";
export { toQuery } from "./endpoints/query";
export type { ListParams } from "./endpoints/query";

export * as authApi from "./endpoints/auth";
export * as recipesApi from "./endpoints/recipes";
export * as eatOutApi from "./endpoints/eatOut";
export * as discoveryApi from "./endpoints/discovery";
export * as trackingApi from "./endpoints/tracking";
export * as savedItemsApi from "./endpoints/savedItems";
export * as collectionsApi from "./endpoints/collections";
export * as ratingsApi from "./endpoints/ratings";
export * as shoppingListsApi from "./endpoints/shoppingLists";
export * as medicationApi from "./endpoints/medication";
export * as profileApi from "./endpoints/profile";
export * as onboardingApi from "./endpoints/onboarding";
export * as ageGateApi from "./endpoints/ageGate";
export type {
  CollectionInput,
  CollectionPatch,
  CollectionDetailParams,
} from "./endpoints/collections";
export type { UpsertRatingInput } from "./endpoints/ratings";
export type { AccountPrompt, FeatureGate } from "./endpoints/discovery";
export type {
  FirstTimeState,
  MealRecommendation,
  MealRecommendations,
  Momentum,
} from "./endpoints/tracking";
export type {
  CookingState,
  CookingStateUpdate,
  ExperienceState,
} from "./endpoints/profile";
