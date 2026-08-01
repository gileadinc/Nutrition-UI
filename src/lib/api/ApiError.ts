export type ApiErrorKind = "network" | "timeout" | "parse" | "api";

export interface ApiErrorOptions {
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code ?? options.kind;
    this.details = options.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
