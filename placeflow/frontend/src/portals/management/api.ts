/**
 * PlaceFlow / Meridian — Management Portal API Layer.
 * Validates network responses at the edge with Zod schemas.
 * Throws ApiError('BadResponse') on validation failure.
 */

import { client } from '../../core/api/client';
import { parseEdge, z } from '../../core/api/parseEdge';

export const managementApi = {
  getNirfMetrics: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/management/nirf/metrics/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getFairnessMetrics: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/management/fairness/audit/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getConsentRecords: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/management/consent/records/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getAgentRuns: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/management/agents/runs/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  getReports: async (): Promise<Record<string, any>> => {
    const raw = await client.get<unknown>('/management/reports/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },
};

export const api = managementApi;
