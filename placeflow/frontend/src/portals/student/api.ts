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
  venue_or_link?: string;
  role?: string;
  company_name?: string;
  interviewer?: string;
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

export interface PlacementReadiness {
  student_id: string;
  opted_out: boolean;
  status: string;
  placement_probability?: number;
  placement_probability_ratio?: number;
  expected_package_lpa?: number;
  readiness_band?: 'READY' | 'MODERATE' | 'NEEDS_PREPARATION';
  risk_level?: string;
  confidence?: number;
  risk_tier?: string;
  drivers?: Array<{
    feature: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    contribution_weight: number;
    explanation: string;
  }>;
  model_version?: string;
  message?: string;
}

export interface SkillRecommendations {
  student_id: string;
  current_skills: string[];
  recommendations: string[];
  recommended_skills?: string[];
  market_demand_basis?: string;
}

export interface WhatIfSimulationResult {
  student_id: string;
  opted_out: boolean;
  baseline?: {
    cgpa: number;
    backlogs: number;
    skills: string[];
    placement_probability: number;
    risk_level: string;
    expected_package_lpa: number;
  };
  simulated?: {
    cgpa: number;
    backlogs: number;
    skills: string[];
    placement_probability: number;
    risk_level: string;
    expected_package_lpa: number;
    package_band_80: {
      lower_bound_lpa: number;
      median_lpa: number;
      upper_bound_lpa: number;
      interval_coverage: string;
    };
    eligible_drives_count: number;
  };
  explanations?: string[];
  disclaimer?: string;
  message?: string;
}

export const studentApi = {
  // Candidate Profile Dossier
  getMe: () => client.get<StudentProfile>('/student/me/'),
  updateProfile: (data: { skills?: string[]; remarks?: string; phone?: string; ml_opt_out?: boolean }) =>
    client.patch<StudentProfile>('/student/profile/', data),

  // Machine Learning & Predictive Insights
  getReadinessInsights: () => client.get<PlacementReadiness>('/student/insights/readiness/'),
  getSkillRecommendations: () => client.get<SkillRecommendations>('/student/insights/skills/'),
  simulateWhatIf: (data: { target_cgpa?: number; target_backlogs?: number; added_skills?: string[] }) =>
    client.post<WhatIfSimulationResult>('/student/insights/whatif/', data),

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
