/**
 * PlaceFlow / Meridian — Management Portal API Layer (Phase 6).
 */

import { client } from '../../core/api/client';

export const managementApi = {
  getNirfMetrics: () => client.get<any>('/management/nirf/metrics/'),
  getFairnessMetrics: () => client.get<any>('/management/fairness/audit/'),
  getConsentRecords: () => client.get<any>('/management/consent/records/'),
  getAgentRuns: () => client.get<any>('/management/agents/runs/'),
  getReports: () => client.get<any>('/management/reports/'),
};

export const api = managementApi;
