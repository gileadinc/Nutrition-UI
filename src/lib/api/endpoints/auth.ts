import { apiClient } from "../client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
}

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/auth/login", payload);
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
}

export function register(payload: RegisterRequest): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>("/auth/register", payload);
}
