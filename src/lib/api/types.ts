export interface ApiErrorDetails {
  /** Field-level validation errors keyed by field name. */
  fieldErrors?: Record<string, string[]>;
  /** Non-field validation errors. */
  formErrors?: string[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetails | unknown;
}

/**
 * The Nutrition backend wraps every response in this envelope:
 *   success:  { success: true,  message, data }
 *   error:    { success: false, message, statusCode, details? }
 */
export interface ApiSuccessEnvelope<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  statusCode?: number;
  /** Present on validation failures. */
  details?: ApiErrorDetails;
  /** Legacy shape kept for back-compat with older mock responses. */
  error?: ApiErrorBody;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
