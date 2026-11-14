/**
 * PlaceFlow / Meridian — HOD Portal API Layer.
 * Validates network responses at the edge with Zod schemas.
 * Throws ApiError('BadResponse') on validation failure.
 */

import { client } from '../../core/api/client';
import { parseEdge, z } from '../../core/api/parseEdge';

export const hodApi = {
  getInstitutionalSummary: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/hod/summary/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getStudents: async (): Promise<{ count: number; students: any[] }> => {
    const raw = await client.get<unknown>('/hod/students/');
    return parseEdge(z.object({
      count: z.number().default(0),
      students: z.array(z.any()).default([]),
    }), raw);
  },

  getStudent: async (id: string): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>(`/hod/students/${id}/`);
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getFaculty: async (): Promise<{ count: number; faculty: any[] }> => {
    const raw = await client.get<unknown>('/hod/faculty/');
    return parseEdge(z.object({
      count: z.number().default(0),
      faculty: z.array(z.any()).default([]),
    }), raw);
  },
};

export const api = hodApi;
