import { apiClient } from "../client";

export interface AgeGateInput {
  age: number;
  isAgeConfirmed: boolean;
  sessionId?: string;
}

export interface AgeGateResult {
  sessionId: string;
  allowed: boolean;
  minimumAge: number;
  nextStep: string;
}

export function verifyAgeGate(input: AgeGateInput): Promise<AgeGateResult> {
  return apiClient.post<AgeGateResult>("/api/age-gate/verify", input);
}
