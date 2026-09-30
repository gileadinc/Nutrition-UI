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
export * as profileApi from "./endpoints/profile";
export * as onboardingApi from "./endpoints/onboarding";
export * as ageGateApi from "./endpoints/ageGate";
export * as adminApi from "./endpoints/admin";
export type {
  AdminOverview,
  AdminDashboard,
  AdminRecipe,
  AdminRestaurant,
  AdminMenuItem,
  AdminFastHack,
  RecipeInput,
  RestaurantInput,
  MenuItemInput,
  FastHackInput,
  PublishInput,
  PublishStatus,
  AdminResourceKind,
} from "./endpoints/admin";
