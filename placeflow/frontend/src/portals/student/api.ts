/**
 * PlaceFlow / Meridian — Student Portal API Layer.
 * Validates all network responses at the edge with Zod schemas.
 * Throws ApiError('BadResponse') on validation failure.
 */

import { client } from '../../core/api/client';
import { parseEdge, z } from '../../core/api/parseEdge';

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

export const StudentProfileSchema = z.object({
  student_id: z.string().nullable().optional().transform((v) => v ?? ''),
  name: z.string().nullable().optional().transform((v) => v ?? ''),
  email: z.string().nullable().optional().transform((v) => v ?? ''),
  phone: z.union([z.string(), z.number()]).nullable().optional().transform((v) => v != null ? String(v) : undefined),
  department: z.string().nullable().optional().default(''),
  cgpa: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
  attendance: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
  backlogs: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
  skills: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  remarks: z.string().nullable().optional(),
  placement_status: z.string().nullable().optional(),
  tier_entitlement: z.string().nullable().optional(),
  ml_opt_out: z.boolean().nullable().optional(),
  mentorship_relations: z.array(z.object({
    from_id: z.string().nullable().optional().transform((v) => v ?? ''),
    to_id: z.string().nullable().optional().transform((v) => v ?? ''),
    relation_type: z.string().nullable().optional().transform((v) => v ?? ''),
  })).nullable().optional().transform((v) => v ?? []),
  vti: z.object({
    overall: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    percentile: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
    category: z.string().nullable().optional().default(''),
  }).nullable().optional(),
}).passthrough();

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

export const StudentOpportunitySchema = z.object({
  job_id: z.string(),
  title: z.string(),
  company_id: z.string().nullable().optional().transform((v) => v ?? ''),
  company_name: z.string().nullable().optional().transform((v) => v ?? ''),
  company_industry: z.string().nullable().optional().transform((v) => v ?? undefined),
  package_lpa: z.number().nullable().optional().transform((v) => v ?? 0),
  tier: z.string().nullable().optional().transform((v) => v ?? 'NORMAL'),
  vacancies: z.number().nullable().optional().transform((v) => v ?? 1),
  deadline: z.string().nullable().optional().transform((v) => v ?? undefined),
  eligibility: z.object({
    min_cgpa: z.number().nullable().optional().transform((v) => v ?? undefined),
    max_backlogs: z.number().nullable().optional().transform((v) => v ?? undefined),
    allowed_branches: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  }).passthrough().nullable().optional().transform((v) => v ?? undefined),
  has_applied: z.boolean().nullable().optional().transform((v) => v ?? false),
  eligible: z.boolean().nullable().optional().transform((v) => v ?? false),
  reasons: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
}).passthrough();

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

export const StudentApplicationSchema = z.object({
  application_id: z.string(),
  job_id: z.string().nullable().optional().transform((v) => v ?? ''),
  job_title: z.string().nullable().optional().transform((v) => v ?? ''),
  company_name: z.string().nullable().optional().transform((v) => v ?? ''),
  tier: z.string().nullable().optional().transform((v) => v ?? ''),
  package_lpa: z.number().nullable().optional().transform((v) => v ?? 0),
  status: z.string().nullable().optional().transform((v) => v ?? 'APPLIED'),
  application_date: z.string().nullable().optional().transform((v) => v ?? undefined),
}).passthrough();

export interface StudentInterview {
  interview_id: string;
  student_id: string;
  job_id: string;
  round: number | string;
  scheduled_start: string;
  scheduled_end: string;
  mode: string;
  venue?: string;
  venue_or_link?: string;
  role?: string;
  company_name?: string;
  interviewer?: string;
  status: string;
  result?: string;
}

export const StudentInterviewSchema = z.object({
  interview_id: z.string(),
  student_id: z.string().nullable().optional().transform((v) => v ?? ''),
  job_id: z.string().nullable().optional().transform((v) => v ?? ''),
  round: z.union([z.number(), z.string()]).nullable().optional().transform((v) => v ?? 1),
  scheduled_start: z.string().nullable().optional().transform((v) => v ?? ''),
  scheduled_end: z.string().nullable().optional().transform((v) => v ?? ''),
  mode: z.string().nullable().optional().transform((v) => v ?? 'ONLINE'),
  venue: z.string().nullable().optional().transform((v) => v ?? undefined),
  venue_or_link: z.string().nullable().optional().transform((v) => v ?? undefined),
  role: z.string().nullable().optional().transform((v) => v ?? undefined),
  company_name: z.string().nullable().optional().transform((v) => v ?? undefined),
  interviewer: z.string().nullable().optional().transform((v) => v ?? undefined),
  status: z.string().nullable().optional().transform((v) => v ?? 'SCHEDULED'),
  result: z.string().nullable().optional().transform((v) => v ?? undefined),
}).passthrough();

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

export const StudentOfferSchema = z.object({
  placement_id: z.string(),
  student_id: z.string().nullable().optional().transform((v) => v ?? ''),
  job_id: z.string().nullable().optional().transform((v) => v ?? ''),
  role: z.string().nullable().optional().transform((v) => v ?? undefined),
  company_id: z.string().nullable().optional().transform((v) => v ?? undefined),
  package_lpa: z.number().nullable().optional().transform((v) => v ?? 0),
  placement_date: z.string().nullable().optional().transform((v) => v ?? undefined),
  response_status: z.enum(['Accepted', 'Declined']).nullable().optional(),
  responded_at: z.string().nullable().optional(),
  status: z.string().nullable().optional().transform((v) => v ?? undefined),
}).passthrough();

export interface StudentConsent {
  consent_id?: string;
  student_id: string;
  purpose: string;
  purpose_title?: string;
  status: string;
  is_mandatory?: boolean;
  description?: string;
  disclosed_fields?: string[];
  notice_version?: string;
  valid_until?: string | null;
  granted_at?: string | null;
  withdrawn_at?: string | null;
}

export const StudentConsentSchema = z.object({
  consent_id: z.string().nullable().optional().transform((v) => v ?? undefined),
  student_id: z.string().nullable().optional().transform((v) => v ?? ''),
  purpose: z.string().nullable().optional().transform((v) => v ?? ''),
  purpose_title: z.string().nullable().optional().transform((v) => v ?? undefined),
  status: z.string().nullable().optional().transform((v) => v ?? 'ACTIVE'),
  is_mandatory: z.boolean().nullable().optional().transform((v) => v ?? false),
  description: z.string().nullable().optional().transform((v) => v ?? undefined),
  disclosed_fields: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  notice_version: z.string().nullable().optional().transform((v) => v ?? undefined),
  valid_until: z.string().nullable().optional(),
  granted_at: z.string().nullable().optional(),
  withdrawn_at: z.string().nullable().optional(),
}).passthrough();

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

export const StudentAcademicsSchema = z.object({
  student_id: z.string().nullable().optional().transform((v) => v ?? ''),
  name: z.string().nullable().optional().transform((v) => v ?? ''),
  cgpa: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
  attendance: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
  backlogs: z.coerce.number().nullable().optional().transform((v) => v ?? 0),
  department: z.string().nullable().optional().transform((v) => v ?? ''),
  year: z.union([z.number(), z.string()]).nullable().optional().transform((v) => typeof v === 'string' ? parseInt(v, 10) || undefined : v ?? undefined),
  batch: z.union([z.number(), z.string()]).nullable().optional().transform((v) => v != null ? String(v) : undefined),
  academic_records: z.array(z.any()).nullable().optional().transform((v) => v ?? []),
  courses: z.array(z.any()).nullable().optional().transform((v) => v ?? []),
}).passthrough();

export interface PlacementReadinessDriver {
  feature: string;
  impact?: string;
  contribution_weight?: number;
  explanation?: string;
  detail?: string;
}

export interface PlacementReadiness {
  student_id: string;
  opted_out: boolean;
  status: string;
  placement_probability?: number;
  placement_probability_ratio?: number;
  expected_package_lpa?: number;
  readiness_band?: string;
  risk_level?: string;
  confidence?: number;
  risk_tier?: string;
  drivers?: PlacementReadinessDriver[];
  model_version?: string;
  latency_ms?: number;
  message?: string;
}

export const PlacementReadinessSchema = z.object({
  student_id: z.string().nullable().optional().transform((v) => v ?? ''),
  opted_out: z.boolean().nullable().optional().transform((v) => v ?? false),
  status: z.string().nullable().optional().transform((v) => v ?? 'ACTIVE'),
  placement_probability: z.number().nullable().optional().transform((v) => v ?? undefined),
  placement_probability_ratio: z.number().nullable().optional().transform((v) => v ?? undefined),
  expected_package_lpa: z.number().nullable().optional().transform((v) => v ?? undefined),
  readiness_band: z.string().nullable().optional().transform((v) => v ?? undefined),
  risk_level: z.string().nullable().optional().transform((v) => v ?? undefined),
  confidence: z.number().nullable().optional().transform((v) => v ?? undefined),
  risk_tier: z.string().nullable().optional().transform((v) => v ?? undefined),
  drivers: z.array(z.object({
    feature: z.string().nullable().optional().transform((v) => v ?? ''),
    impact: z.string().nullable().optional().transform((v) => v ?? undefined),
    contribution_weight: z.number().nullable().optional().transform((v) => v ?? undefined),
    explanation: z.string().nullable().optional().transform((v) => v ?? undefined),
    detail: z.string().nullable().optional().transform((v) => v ?? undefined),
  }).passthrough()).nullable().optional().transform((v) => v ?? []),
  model_version: z.string().nullable().optional().transform((v) => v ?? undefined),
  latency_ms: z.number().nullable().optional().transform((v) => v ?? undefined),
  message: z.string().nullable().optional().transform((v) => v ?? undefined),
}).passthrough();

export interface SkillRecommendations {
  student_id: string;
  current_skills: string[];
  recommendations: string[];
  recommended_skills?: string[];
  market_demand_basis?: string;
}

export const SkillRecommendationsSchema = z.object({
  student_id: z.string().nullable().optional().transform((v) => v ?? ''),
  current_skills: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  recommendations: z.array(
    z.union([
      z.string(),
      z.object({ skill: z.string() }).passthrough().transform((o) => o.skill),
    ])
  ).nullable().optional().transform((v) => v ?? []),
  recommended_skills: z.array(
    z.union([
      z.string(),
      z.object({ skill: z.string() }).passthrough().transform((o) => o.skill),
    ])
  ).nullable().optional().transform((v) => v ?? undefined),
  market_demand_basis: z.string().nullable().optional().transform((v) => v ?? undefined),
}).passthrough();

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

export const WhatIfSimulationResultSchema = z.object({
  student_id: z.string(),
  opted_out: z.boolean().nullable().optional().transform((v) => v ?? false),
  baseline: z.object({
    cgpa: z.number(),
    backlogs: z.number(),
    skills: z.array(z.string()).default([]),
    placement_probability: z.number(),
    risk_level: z.string(),
    expected_package_lpa: z.number(),
  }).passthrough().optional(),
  simulated: z.object({
    cgpa: z.number(),
    backlogs: z.number(),
    skills: z.array(z.string()).default([]),
    placement_probability: z.number(),
    risk_level: z.string(),
    expected_package_lpa: z.number(),
    package_band_80: z.object({
      lower_bound_lpa: z.number(),
      median_lpa: z.number(),
      upper_bound_lpa: z.number(),
      interval_coverage: z.string(),
    }).passthrough(),
    eligible_drives_count: z.number(),
  }).passthrough().optional(),
  explanations: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  disclaimer: z.string().nullable().optional().transform((v) => v ?? undefined),
  message: z.string().nullable().optional().transform((v) => v ?? undefined),
}).passthrough();

export const studentApi = {
  // Candidate Profile Dossier
  getMe: async (): Promise<StudentProfile> => {
    const raw = await client.get<unknown>('/student/me/');
    return parseEdge(StudentProfileSchema, raw) as unknown as StudentProfile;
  },

  updateProfile: async (data: { skills?: string[]; remarks?: string; phone?: string; ml_opt_out?: boolean }): Promise<StudentProfile> => {
    const raw = await client.patch<unknown>('/student/profile/', data);
    return parseEdge(StudentProfileSchema, raw) as unknown as StudentProfile;
  },

  // Machine Learning & Predictive Insights
  getReadinessInsights: async (): Promise<PlacementReadiness> => {
    const raw = await client.get<unknown>('/student/insights/readiness/');
    return parseEdge(PlacementReadinessSchema, raw);
  },

  getSkillRecommendations: async (): Promise<SkillRecommendations> => {
    const raw = await client.get<unknown>('/student/insights/skills/');
    return parseEdge(SkillRecommendationsSchema, raw);
  },

  simulateWhatIf: async (data: { target_cgpa?: number; target_backlogs?: number; added_skills?: string[] }): Promise<WhatIfSimulationResult> => {
    const raw = await client.post<unknown>('/student/insights/whatif/', data);
    return parseEdge(WhatIfSimulationResultSchema, raw);
  },

  // Opportunities & Recruitment Drives
  getOpportunities: async (): Promise<StudentOpportunity[]> => {
    const raw = await client.get<unknown>('/student/opportunities/');
    return parseEdge(z.array(StudentOpportunitySchema), raw);
  },

  applyOpportunity: async (jobId: string): Promise<{ application_id: string; status: string }> => {
    const raw = await client.post<unknown>(`/student/opportunities/${jobId}/apply/`);
    return parseEdge(z.object({ application_id: z.string(), status: z.string() }), raw);
  },

  // Application Pipeline
  getApplications: async (): Promise<StudentApplication[]> => {
    const raw = await client.get<unknown>('/student/applications/');
    return parseEdge(z.array(StudentApplicationSchema), raw);
  },

  getInterviews: async (): Promise<StudentInterview[]> => {
    const raw = await client.get<unknown>('/student/interviews/');
    return parseEdge(z.array(StudentInterviewSchema), raw);
  },

  getOffers: async (): Promise<StudentOffer[]> => {
    const raw = await client.get<unknown>('/student/offers/');
    return parseEdge(z.array(StudentOfferSchema), raw);
  },

  respondOffer: async (offerId: string, action: 'ACCEPT' | 'DECLINE'): Promise<{ placement_id: string; status: string; responded_at: string }> => {
    const raw = await client.post<unknown>(`/student/offers/${offerId}/respond/`, { action });
    return parseEdge(z.object({
      placement_id: z.string(),
      status: z.string(),
      responded_at: z.string(),
    }), raw);
  },

  // Academics & Progress
  getAcademics: async (): Promise<StudentAcademics> => {
    const raw = await client.get<unknown>('/student/academics/');
    return parseEdge(StudentAcademicsSchema, raw) as unknown as StudentAcademics;
  },

  // DPDP Consent Preferences
  getConsents: async (): Promise<StudentConsent[]> => {
    const raw = await client.get<unknown>('/student/consents/');
    return parseEdge(z.array(StudentConsentSchema), raw);
  },

  recordConsent: async (purpose: string): Promise<{ consent_id: string; status: string }> => {
    const raw = await client.post<unknown>('/student/consents/record/', { purpose });
    return parseEdge(z.object({ consent_id: z.string(), status: z.string() }), raw);
  },

  withdrawConsent: async (purpose: string): Promise<{ success: boolean; message: string }> => {
    const raw = await client.post<unknown>('/student/consents/withdraw/', { purpose });
    return parseEdge(z.object({ success: z.boolean(), message: z.string() }), raw);
  },
};

export const api = studentApi;
