/**
 * PlaceFlow / Meridian — Edge Response Validation Helper.
 * Validates untrusted network responses against Zod schemas.
 * Throws ApiError('BadResponse') on validation failure to prevent components from reading corrupted data.
 */

import { z } from 'zod';
import { ApiError } from './errors';

export function parseEdge<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('[API Edge Parse Error]:', result.error);
    throw new ApiError('BadResponse', 'BadResponse', 'Invalid API response format', result.error.issues);
  }
  return result.data;
}

export { z };

