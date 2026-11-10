/**
 * PlaceFlow / Meridian — Faculty Portal API Layer (Phase 6).
 */

import { client } from '../../core/api/client';

export const facultyApi = {
  getInstitutionalSummary: () => client.get<any>('/faculty/summary/'),
  getMentees: () => client.get<{ count: number; students: any[] }>('/faculty/mentees/'),
  getMentee: (id: string) => client.get<any>(`/faculty/mentees/${id}/`),
};

export const api = facultyApi;
