/**
 * PlaceFlow / Meridian — HOD Portal API Layer (Phase 6).
 */

import { client } from '../../core/api/client';

export const hodApi = {
  getInstitutionalSummary: () => client.get<any>('/hod/summary/'),
  getStudents: () => client.get<{ count: number; students: any[] }>('/hod/students/'),
  getStudent: (id: string) => client.get<any>(`/hod/students/${id}/`),
  getFaculty: () => client.get<{ count: number; faculty: any[] }>('/hod/faculty/'),
};

export const api = hodApi;
