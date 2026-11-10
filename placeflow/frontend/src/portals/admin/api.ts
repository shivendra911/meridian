/**
 * PlaceFlow / Meridian — Admin Portal API Layer (Phase 6).
 */

import { client } from '../../core/api/client';

export const adminApi = {
  getSummary: () => client.get<any>('/admin/summary/'),
  getHierarchyTree: () => client.get<any>('/admin/hierarchy/'),
  getTenants: () => client.get<any>('/admin/tenants/'),
  getInstitutions: () => client.get<any>('/admin/institutions/'),
  getCampuses: () => client.get<any>('/admin/campuses/'),
  getIdentities: () => client.get<any>('/admin/iam/identities/'),
  getAccounts: () => client.get<any>('/admin/iam/accounts/'),
  getRoles: () => client.get<any>('/admin/iam/roles/'),
  getAssignments: () => client.get<any>('/admin/iam/assignments/'),
  getCourses: () => client.get<any>('/admin/academic/courses/'),
  getAiTraces: () => client.get<any>('/admin/ai/traces/'),
};

export const api = adminApi;
