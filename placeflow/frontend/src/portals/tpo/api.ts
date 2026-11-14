/**
 * PlaceFlow / Meridian — TPO Portal API Layer.
 * Validates all network responses at the edge with Zod schemas.
 * Throws ApiError('BadResponse') on validation failure.
 */

import { client } from '../../core/api/client';
import { parseEdge, z } from '../../core/api/parseEdge';
import {
  OverviewData,
  Student,
  Job,
  Company,
  Application,
  Interview,
  Placement,
  SuperdayConflict,
  RenegeCandidate,
  WhatIfResult,
  UnifiedProfile,
  ConsentRecord,
} from '../../types';

// Zod schemas for TPO entities
export const OverviewDataSchema = z.object({
  kpis: z.object({
    total_students: z.number().default(0),
    placement_pct: z.number().default(0),
    total_companies: z.number().default(0),
    open_jobs: z.number().default(0),
    total_applications: z.number().default(0),
    offers_selected: z.number().default(0),
    average_package_lpa: z.number().default(0),
    highest_package_lpa: z.number().default(0),
    top_hiring_company: z.string().default(''),
  }).passthrough(),
  top_roles: z.array(z.object({
    title: z.string().default(''),
    location: z.string().default(''),
    package_lpa: z.number().default(0),
    tier: z.string().default('NORMAL'),
  }).passthrough()).default([]),
  pipeline_health: z.array(z.object({
    status: z.string(),
    n: z.number().default(0),
    pct: z.number().default(0),
  }).passthrough()).default([]),
  recent_activity: z.array(z.any()).default([]),
  branch_velocity: z.object({
    labels: z.array(z.string()).default([]),
    rates: z.array(z.number()).default([]),
    rows: z.array(z.any()).default([]),
  }).default({ labels: [], rates: [], rows: [] }),
  tier_distribution: z.union([
    z.object({
      labels: z.array(z.string()).default([]),
      counts: z.array(z.number()).default([]),
    }),
    z.record(z.string(), z.number()),
  ]).default({ labels: [], counts: [] }),
  cluster_status: z.any().optional(),
}).passthrough();

const JobSchema = z.object({
  job_id: z.string(),
  company_id: z.string().default(''),
  title: z.string(),
  description: z.string().default(''),
  package_lpa: z.number().default(0),
  tier: z.string().default('NORMAL'),
  vacancies: z.number().default(1),
  location: z.string().default(''),
  status: z.string().default('DRAFT'),
  skills_required: z.array(z.string()).optional(),
  eligibility: z.object({
    min_cgpa: z.number().nullable().optional(),
    max_backlogs: z.number().nullable().optional(),
    departments: z.array(z.string()).default([]),
    allowed_branches: z.array(z.string()).default([]),
  }).passthrough().optional(),
  created_at: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
}).passthrough();

const CompanySchema = z.object({
  company_id: z.string(),
  name: z.string(),
  industry: z.string().default(''),
  location: z.string().default(''),
  tier: z.string().default('NORMAL'),
  verified: z.boolean().default(false),
  website: z.string().nullable().optional(),
  active_drives: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
}).passthrough();

const ApplicationSchema = z.object({
  application_id: z.string(),
  job_id: z.string().default(''),
  student_id: z.string().default(''),
  status: z.string().default('APPLIED'),
  applied_at: z.string().nullable().optional(),
  application_date: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  student_name: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  tier: z.string().nullable().optional(),
  package_lpa: z.number().nullable().optional(),
  department: z.string().nullable().optional(),
  cgpa: z.number().nullable().optional(),
}).passthrough();

const InterviewSchema = z.object({
  interview_id: z.string(),
  application_id: z.string().default(''),
  student_id: z.string().default(''),
  job_id: z.string().default(''),
  round: z.union([z.number(), z.string()]).default(1),
  scheduled_start: z.string().default(''),
  scheduled_end: z.string().default(''),
  mode: z.string().default('ONLINE'),
  venue: z.string().nullable().optional(),
  venue_or_link: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  interviewer: z.string().nullable().optional(),
  status: z.string().optional(),
  result: z.string().default('Scheduled'),
  was_rescheduled: z.boolean().optional(),
}).passthrough();

const StudentSchema = z.object({
  student_id: z.string(),
  name: z.string(),
  email: z.string().nullable().optional().default(''),
  department: z.string().nullable().optional().default(''),
  cgpa: z.number().nullable().optional().transform((v) => v ?? 0),
  attendance: z.number().nullable().optional().transform((v) => v ?? 0),
  backlogs: z.number().nullable().optional().transform((v) => v ?? 0),
  skills: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  placement_status: z.string().nullable().optional().default('NOT_PLACED'),
  tier_entitlement: z.string().nullable().optional(),
  vti: z.any().optional(),
  ai_risk: z.any().optional(),
  year: z.number().nullable().optional(),
  reg_no: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
}).passthrough();

export const tpoApi = {
  getOverview: async (): Promise<OverviewData> => {
    const raw = await client.get<unknown>('/tpo/overview/');
    return parseEdge(OverviewDataSchema, raw) as unknown as OverviewData;
  },

  // Placement Drives & JNFs
  getJobs: async (): Promise<{ count: number; jobs: Job[] }> => {
    const raw = await client.get<unknown>('/tpo/jobs/');
    return parseEdge(z.object({
      count: z.number().default(0),
      jobs: z.array(JobSchema).default([]),
    }), raw) as unknown as { count: number; jobs: Job[] };
  },

  getJob: async (jobId: string): Promise<Job> => {
    const raw = await client.get<unknown>(`/tpo/jobs/${jobId}/`);
    return parseEdge(JobSchema, raw) as unknown as Job;
  },

  addJob: async (data: Partial<Job>): Promise<{ status: string; job_id: string }> => {
    const raw = await client.post<unknown>('/tpo/jobs/', data);
    return parseEdge(z.object({ status: z.string(), job_id: z.string() }), raw);
  },

  getJobCandidates: async (jobId: string): Promise<{ job_id: string; candidates: Student[]; count: number }> => {
    const raw = await client.get<unknown>(`/tpo/jobs/${jobId}/candidates/`);
    return parseEdge(z.object({
      job_id: z.string(),
      candidates: z.array(StudentSchema).default([]),
      count: z.number().default(0),
    }), raw) as unknown as { job_id: string; candidates: Student[]; count: number };
  },

  // Recruiting Partners / Companies
  getCompanies: async (): Promise<{ count: number; companies: Company[] }> => {
    const raw = await client.get<unknown>('/tpo/companies/');
    return parseEdge(z.object({
      count: z.number().default(0),
      companies: z.array(CompanySchema).default([]),
    }), raw) as unknown as { count: number; companies: Company[] };
  },

  getCompany: async (companyId: string): Promise<Company> => {
    const raw = await client.get<unknown>(`/tpo/companies/${companyId}/`);
    return parseEdge(CompanySchema, raw) as unknown as Company;
  },

  addCompany: async (data: Partial<Company>): Promise<{ status: string; company_id: string }> => {
    const raw = await client.post<unknown>('/tpo/companies/', data);
    return parseEdge(z.object({ status: z.string(), company_id: z.string() }), raw);
  },

  // Applications & Pipeline
  getApplications: async (): Promise<{ count: number; applications: Application[] }> => {
    const raw = await client.get<unknown>('/tpo/applications/');
    return parseEdge(z.object({
      count: z.number().default(0),
      applications: z.array(ApplicationSchema).default([]),
    }), raw) as unknown as { count: number; applications: Application[] };
  },

  applyForJob: async (studentId: string, jobId: string): Promise<{ status: string; application_id: string }> => {
    const raw = await client.post<unknown>('/tpo/applications/', { student_id: studentId, job_id: jobId });
    return parseEdge(z.object({ status: z.string(), application_id: z.string() }), raw);
  },

  updateApplicationStatus: async (applicationId: string, newStatus: string, note?: string): Promise<{ status: string; application_id: string; new_status: string }> => {
    const raw = await client.post<unknown>(`/tpo/applications/${applicationId}/status/`, { status: newStatus, note });
    return parseEdge(z.object({ status: z.string(), application_id: z.string(), new_status: z.string() }), raw);
  },

  // Interviews & Superday Solver
  getInterviews: async (): Promise<{ count: number; interviews: Interview[] }> => {
    const raw = await client.get<unknown>('/tpo/interviews/');
    return parseEdge(z.object({
      count: z.number().default(0),
      interviews: z.array(InterviewSchema).default([]),
    }), raw) as unknown as { count: number; interviews: Interview[] };
  },

  scheduleInterview: async (data: Partial<Interview>): Promise<{ status: string; interview_id: string }> => {
    const raw = await client.post<unknown>('/tpo/interviews/', data);
    return parseEdge(z.object({ status: z.string(), interview_id: z.string() }), raw);
  },

  getSuperdayConflicts: async (): Promise<{
    clashes_count: number;
    status: string;
    conflicts: SuperdayConflict[];
    interviews: Interview[];
  }> => {
    const raw = await client.get<unknown>('/tpo/superday/conflicts/');
    return parseEdge(z.object({
      clashes_count: z.number().default(0),
      status: z.string().default(''),
      conflicts: z.array(z.any()).default([]),
      interviews: z.array(InterviewSchema).default([]),
    }), raw) as unknown as {
      clashes_count: number;
      status: string;
      conflicts: SuperdayConflict[];
      interviews: Interview[];
    };
  },

  resolveSuperdayConflicts: async (): Promise<{ status: string; resolved_count: number; message: string }> => {
    const raw = await client.post<unknown>('/tpo/superday/resolve/');
    return parseEdge(z.object({
      status: z.string().default('SUCCESS'),
      resolved_count: z.number().default(0),
      message: z.string().default(''),
    }), raw);
  },

  // Offers & Placements
  getPlacements: async (): Promise<{ count: number; placements: Placement[] }> => {
    const raw = await client.get<unknown>('/tpo/placements/');
    return parseEdge(z.object({
      count: z.number().default(0),
      placements: z.array(z.any()).default([]),
    }), raw) as unknown as { count: number; placements: Placement[] };
  },

  createPlacement: async (studentId: string, jobId: string): Promise<{ status: string; placement_id: string; message: string }> => {
    const raw = await client.post<unknown>('/tpo/placements/', { student_id: studentId, job_id: jobId });
    return parseEdge(z.object({
      status: z.string(),
      placement_id: z.string(),
      message: z.string().default(''),
    }), raw);
  },

  // Students Directory & Profiles
  getStudents: async (department?: string, search?: string): Promise<{ count: number; students: Student[] }> => {
    const params: Record<string, string> = {};
    if (department && department !== 'ALL') params.department = department;
    if (search) params.search = search;
    const raw = await client.get<unknown>('/tpo/students/', { params });
    return parseEdge(z.object({
      count: z.number().default(0),
      students: z.array(StudentSchema).default([]),
    }), raw) as unknown as { count: number; students: Student[] };
  },

  getStudent: async (studentId: string): Promise<{
    student: Student;
    vti?: Student['vti'];
    eligible_jobs: Job[];
    applications: Application[];
    interviews: Interview[];
    ai_prediction?: Student['ai_risk'];
    skill_recommendations: any[];
    consents: ConsentRecord[];
  }> => {
    const raw = await client.get<unknown>(`/tpo/students/${studentId}/`);
    return parseEdge(z.object({
      student: StudentSchema,
      vti: z.any().optional(),
      eligible_jobs: z.array(JobSchema).default([]),
      applications: z.array(ApplicationSchema).default([]),
      interviews: z.array(InterviewSchema).default([]),
      ai_prediction: z.any().optional(),
      skill_recommendations: z.array(z.any()).default([]),
      consents: z.array(z.any()).default([]),
    }), raw) as unknown as {
      student: Student;
      vti?: Student['vti'];
      eligible_jobs: Job[];
      applications: Application[];
      interviews: Interview[];
      ai_prediction?: Student['ai_risk'];
      skill_recommendations: any[];
      consents: ConsentRecord[];
    };
  },

  getUnifiedProfile: async (identifier: string): Promise<UnifiedProfile> => {
    const raw = await client.get<unknown>(`/v4/institutional/profile/${identifier}/`);
    return parseEdge(z.object({
      identifier: z.string().default(identifier),
      display_name: z.string().default(''),
    }).passthrough(), raw) as unknown as UnifiedProfile;
  },

  // Retention Radar (Renege)
  getRenegeRadar: async (): Promise<{
    total_placed_monitored: number;
    critical_count: number;
    moderate_count: number;
    low_count: number;
    avg_renege_probability: number;
    candidates: RenegeCandidate[];
  }> => {
    const raw = await client.get<unknown>('/tpo/insights/renege/');
    return parseEdge(z.object({
      total_placed_monitored: z.number().default(0),
      critical_count: z.number().default(0),
      moderate_count: z.number().default(0),
      low_count: z.number().default(0),
      avg_renege_probability: z.number().default(0),
      candidates: z.array(z.any()).default([]),
    }), raw) as unknown as {
      total_placed_monitored: number;
      critical_count: number;
      moderate_count: number;
      low_count: number;
      avg_renege_probability: number;
      candidates: RenegeCandidate[];
    };
  },

  resolveRenege: async (studentId: string, action: string, notes?: string): Promise<unknown> => {
    return client.post('/renege-radar/resolve/', { student_id: studentId, action, notes });
  },

  // Fairness Audit
  getFairnessAudit: async (): Promise<{
    total_cohort_evaluated: number;
    overall_selection_rate: number;
    disparate_impact_ratio: number;
    fairness_status: string;
    slice_reports: Array<{
      slice: string;
      sample_size: number;
      mean_cgpa: number;
      avg_predicted_probability: number;
      selection_rate_high_prob: number;
      actual_placement_rate: number;
    }>;
    prohibited_features_list: string[];
  }> => {
    const raw = await client.get<unknown>('/tpo/insights/fairness/');
    return parseEdge(z.object({
      total_cohort_evaluated: z.number().default(0),
      overall_selection_rate: z.number().default(0),
      disparate_impact_ratio: z.number().default(0),
      fairness_status: z.string().default('COMPLIANT'),
      slice_reports: z.array(z.object({
        slice: z.string(),
        sample_size: z.number().default(0),
        mean_cgpa: z.number().default(0),
        avg_predicted_probability: z.number().default(0),
        selection_rate_high_prob: z.number().default(0),
        actual_placement_rate: z.number().default(0),
      })).default([]),
      prohibited_features_list: z.array(z.string()).default([]),
    }), raw);
  },

  // Reports
  getReports: async (): Promise<any> => {
    const raw = await client.get<unknown>('/tpo/insights/reports/');
    return parseEdge(z.record(z.string(), z.any()), raw);
  },

  // What-If Career Simulation
  runWhatIfSimulation: async (payload: {
    student_id: string;
    hypothetical_cgpa?: number;
    resolved_backlogs?: number;
    additional_skills?: string[];
  }): Promise<WhatIfResult> => {
    const raw = await client.post<unknown>('/tpo/insights/whatif/', payload);
    return parseEdge(z.object({
      student_id: z.string(),
      simulated: z.any().optional(),
    }).passthrough(), raw) as unknown as WhatIfResult;
  },

  // ML Model Registry & Retraining
  getModelRegistry: async (): Promise<{ total_models: number; models: any[] }> => {
    const raw = await client.get<unknown>('/tpo/models/');
    return parseEdge(z.object({
      total_models: z.number().default(0),
      models: z.array(z.any()).default([]),
    }), raw);
  },

  retrainModels: async (): Promise<{ success: boolean; message: string; metrics?: any }> => {
    const raw = await client.post<unknown>('/tpo/models/retrain/');
    return parseEdge(z.object({
      success: z.boolean().default(true),
      message: z.string().default(''),
      metrics: z.any().optional(),
    }), raw);
  },
};

export const api = tpoApi;
