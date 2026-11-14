/**
 * PlaceFlow / Meridian — Faculty Portal API Layer.
 * Validates network responses at the edge with Zod schemas.
 * Throws ApiError('BadResponse') on validation failure.
 */

import { client } from '../../core/api/client';
import { parseEdge, z } from '../../core/api/parseEdge';

export const facultyApi = {
  getInstitutionalSummary: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/faculty/summary/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getMentees: async (): Promise<{ count: number; students: any[] }> => {
    const raw = await client.get<unknown>('/faculty/mentees/');
    return parseEdge(z.object({
      count: z.number().default(0),
      students: z.array(z.any()).default([]),
    }), raw);
  },

  getMentee: async (id: string): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>(`/faculty/mentees/${id}/`);
    return parseEdge(z.record(z.string(), z.any()), raw);
  },
};

export const api = facultyApi;
