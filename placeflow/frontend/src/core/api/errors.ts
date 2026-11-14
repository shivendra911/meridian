/**
 * PlaceFlow / Meridian — API Errors & Exception Classes (Phase 4).
 */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(statusOrCode: number | string, code?: string, message?: string, details?: any) {
    if (typeof statusOrCode === 'string') {
      super(code || statusOrCode);
      this.status = 500;
      this.code = statusOrCode;
      this.details = details || message;
    } else {
      super(message || code || 'ApiError');
      this.status = statusOrCode;
      this.code = code || 'Unknown';
      this.details = details;
    }
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'InvalidCredentials':
        return 'Invalid username or password.';
      case 'SessionExpired':
      case 'AuthenticationRequired':
        return 'Your session has expired. Please log in again.';
      case 'Forbidden':
      case 'PermissionDenied':
      case 'AccessDenied':
        return 'You do not have permission to access this resource.';
      case 'TenantMismatch':
        return 'Security validation failed: tenant mismatch.';
      case 'NotFound':
        return 'The requested resource was not found.';
      case 'RateLimitExceeded':
        return 'Too many attempts. Please wait a few moments before trying again.';
      case 'BadResponse':
        return 'The server returned an invalid or malformed data structure.';
      case 'ValidationError':
        return error.message || 'Please check your inputs and try again.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
