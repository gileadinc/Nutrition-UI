import { apiClient } from "../client";
import { authHeader } from "@/lib/auth";
import type { GuestHome, HomeFeed } from "../models";
import { toQuery } from "./query";

export interface DiscoveryParams {
  sessionId?: string;
  goal?: string;
  near?: string;
  query?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export function getGuestHome(params?: DiscoveryParams): Promise<GuestHome> {
  return apiClient.get<GuestHome>(`/api/discovery/guest-home${toQuery(params)}`);
}

/** Authenticated: personalized home feed + today's progress. Requires a bearer token. */
export function getHome(): Promise<HomeFeed> {
  return apiClient.get<HomeFeed>("/api/discovery/home", { headers: authHeader() });
}

export function getAppEntry(params?: DiscoveryParams): Promise<unknown> {
  return apiClient.get<unknown>(`/api/discovery/app-entry${toQuery(params)}`);
}

export interface AccountPrompt {
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
}

export function getAccountPrompt(context: string): Promise<AccountPrompt> {
  return apiClient.get<AccountPrompt>(`/api/discovery/account-prompt${toQuery({ context })}`);
}

export interface FeatureGate {
  featureKey: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export function getFeatureGate(featureKey: string): Promise<FeatureGate> {
  return apiClient.get<FeatureGate>(
    `/api/discovery/feature-gates/${encodeURIComponent(featureKey)}`,
  );
}

export interface DiscoverySearchResult {
  items: unknown[];
  pagination?: unknown;
  suggestions: string[];
}

export function searchDiscovery(params: DiscoveryParams): Promise<DiscoverySearchResult> {
  return apiClient.get<DiscoverySearchResult>(`/api/discovery/search${toQuery(params)}`);
}

export function getFilters(): Promise<unknown> {
  return apiClient.get<unknown>("/api/discovery/filters");
}
