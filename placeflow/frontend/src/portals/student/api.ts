/**
 * PlaceFlow / Meridian — Student Portal API Layer (Phase 5).
 *
 * All network calls are strictly self-scoped through authenticated session context.
 * Zero student IDs or registration numbers in URL paths or request payloads.
 */

import { client } from '../../core/api/client';

export interface StudentProfile {
  student_id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  cgpa: number;
  attendance: number;
  backlogs: number;
  skills: string[];
  remarks?: string;
  placement_status?: string;
  tier_entitlement?: string;
  ml_opt_out?: boolean;
  mentorship_relations?: Array<{ from_id: string; to_id: string; relation_type: string }>;
  vti?: {
    overall: number;
    percentile: number;
    category: string;
  };
}

export interface StudentOpportunity {
  job_id: string;
  title: string;
  company_id: string;
  company_name: string;
  company_industry?: string;
  package_lpa: number;
  tier: string;
  vacancies: number;
  deadline?: string;
  eligibility?: {
    min_cgpa?: number;
    max_backlogs?: number;
    allowed_branches?: string[];
  };
  has_applied: boolean;
  eligible: boolean;
  reasons: string[];
}

export interface StudentApplication {
  application_id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  tier: string;
  package_lpa: number;
  status: string;
  application_date?: string;
}

export interface StudentInterview {
  interview_id: string;
  student_id: string;
  job_id: string;
  round: number;
  scheduled_start: string;
  scheduled_end: string;
  mode: string;
  venue?: string;
  status: string;
}

export interface StudentOffer {
  placement_id: string;
  student_id: string;
  job_id: string;
  role?: string;
  company_id?: string;
  package_lpa: number;
  placement_date?: string;
  response_status?: 'Accepted' | 'Declined' | null;
  responded_at?: string | null;
  status?: string;
}

export interface StudentConsent {
  consent_id: string;
  student_id: string;
  purpose: string;
  status: string;
  valid_until?: string;
  granted_at?: string;
  withdrawn_at?: string;
}

export interface StudentAcademics {
  student_id: string;
  name: string;
  cgpa: number;
  attendance: number;
  backlogs: number;
  department: string;
  year?: number;
  batch?: string;
  academic_records?: any[];
  courses?: any[];
}

export const studentApi = {
  // Candidate Profile Dossier
  getMe: () => client.get<StudentProfile>('/student/me/'),
  updateProfile: (data: { skills?: string[]; remarks?: string; phone?: string; ml_opt_out?: boolean }) =>
    client.patch<StudentProfile>('/student/profile/', data),

  // Opportunities & Recruitment Drives
  getOpportunities: () => client.get<StudentOpportunity[]>('/student/opportunities/'),
  applyOpportunity: (jobId: string) =>
    client.post<{ application_id: string; status: string }>(`/student/opportunities/${jobId}/apply/`),

  // Application Pipeline
  getApplications: () => client.get<StudentApplication[]>('/student/applications/'),
  getInterviews: () => client.get<StudentInterview[]>('/student/interviews/'),
  getOffers: () => client.get<StudentOffer[]>('/student/offers/'),
  respondOffer: (offerId: string, action: 'ACCEPT' | 'DECLINE') =>
    client.post<{ placement_id: string; status: string; responded_at: string }>(`/student/offers/${offerId}/respond/`, { action }),

  // Academics & Progress
  getAcademics: () => client.get<StudentAcademics>('/student/academics/'),

  // DPDP Consent Preferences
  getConsents: () => client.get<StudentConsent[]>('/student/consents/'),
  recordConsent: (purpose: string) =>
    client.post<{ consent_id: string; status: string }>('/student/consents/record/', { purpose }),
  withdrawConsent: (purpose: string) =>
    client.post<{ success: boolean; message: string }>('/student/consents/withdraw/', { purpose }),
};

export const api = studentApi;
