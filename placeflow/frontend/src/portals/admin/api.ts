/**
 * PlaceFlow / Meridian — Admin Portal API Layer.
 * Validates network responses at the edge with Zod schemas.
 * Throws ApiError('BadResponse') on validation failure.
 */

import { client } from '../../core/api/client';
import { parseEdge, z } from '../../core/api/parseEdge';

export const adminApi = {
  getSummary: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/admin/summary/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getHierarchyTree: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/admin/hierarchy/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getTenants: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/tenants/');
    return parseEdge(z.array(z.any()), raw);
  },

  getInstitutions: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/institutions/');
    return parseEdge(z.array(z.any()), raw);
  },

  getCampuses: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/campuses/');
    return parseEdge(z.array(z.any()), raw);
  },

  getIdentities: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/iam/identities/');
    return parseEdge(z.array(z.any()), raw);
  },

  getAccounts: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/iam/accounts/');
    return parseEdge(z.array(z.any()), raw);
  },

  getRoles: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/iam/roles/');
    return parseEdge(z.array(z.any()), raw);
  },

  getAssignments: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/iam/assignments/');
    return parseEdge(z.array(z.any()), raw);
  },

  getCourses: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/academic/courses/');
    return parseEdge(z.array(z.any()), raw);
  },

  getAiTraces: async (): Promise<any[]> => {
    const raw = await client.get<unknown>('/admin/ai/traces/');
    return parseEdge(z.array(z.any()), raw);
  },
};

export const api = adminApi;
