/**
 * PlaceFlow / Meridian — TPO Portal API Layer (Phase 6).
 *
 * Dedicated API interface for Training & Placement Office workflows using namespaced /api/tpo/* routes.
 * Uses core client with HttpOnly session credentials and automatic CSRF attachment.
 */

import { client } from '../../core/api/client';
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

export const tpoApi = {
  getOverview: () => client.get<OverviewData>('/tpo/overview/'),

  // Placement Drives & JNFs
  getJobs: () => client.get<{ count: number; jobs: Job[] }>('/tpo/jobs/'),
  getJob: (jobId: string) => client.get<Job>(`/tpo/jobs/${jobId}/`),
  addJob: (data: Partial<Job>) => client.post<{ status: string; job_id: string }>('/tpo/jobs/', data),
  getJobCandidates: (jobId: string) =>
    client.get<{ job_id: string; candidates: Student[]; count: number }>(`/tpo/jobs/${jobId}/candidates/`),

  // Recruiting Partners / Companies
  getCompanies: () => client.get<{ count: number; companies: Company[] }>('/tpo/companies/'),
  getCompany: (companyId: string) => client.get<Company>(`/tpo/companies/${companyId}/`),
  addCompany: (data: Partial<Company>) => client.post<{ status: string; company_id: string }>('/tpo/companies/', data),

  // Applications & Pipeline
  getApplications: () => client.get<{ count: number; applications: Application[] }>('/tpo/applications/'),
  applyForJob: (studentId: string, jobId: string) =>
    client.post<{ status: string; application_id: string }>('/tpo/applications/', { student_id: studentId, job_id: jobId }),
  updateApplicationStatus: (applicationId: string, newStatus: string, note?: string) =>
    client.post<{ status: string; application_id: string; new_status: string }>(
      `/tpo/applications/${applicationId}/status/`,
      { status: newStatus, note }
    ),

  // Interviews & Superday Solver
  getInterviews: () => client.get<{ count: number; interviews: Interview[] }>('/tpo/interviews/'),
  scheduleInterview: (data: Partial<Interview>) =>
    client.post<{ status: string; interview_id: string }>('/tpo/interviews/', data),
  getSuperdayConflicts: () =>
    client.get<{
      clashes_count: number;
      status: string;
      conflicts: SuperdayConflict[];
      interviews: Interview[];
    }>('/tpo/superday/conflicts/'),
  resolveSuperdayConflicts: () =>
    client.post<{ status: string; resolved_count: number; message: string }>('/tpo/superday/resolve/'),

  // Offers & Placements
  getPlacements: () => client.get<{ count: number; placements: Placement[] }>('/tpo/placements/'),
  createPlacement: (studentId: string, jobId: string) =>
    client.post<{ status: string; placement_id: string; message: string }>('/tpo/placements/', {
      student_id: studentId,
      job_id: jobId,
    }),

  // Students Directory & Profiles
  getStudents: (department?: string, search?: string) => {
    const params: Record<string, string> = {};
    if (department && department !== 'ALL') params.department = department;
    if (search) params.search = search;
    return client.get<{ count: number; students: Student[] }>('/tpo/students/', { params });
  },
  getStudent: (studentId: string) =>
    client.get<{
      student: Student;
      vti?: Student['vti'];
      eligible_jobs: Job[];
      applications: Application[];
      interviews: Interview[];
      ai_prediction?: Student['ai_risk'];
      skill_recommendations: string[];
      consents: ConsentRecord[];
    }>(`/tpo/students/${studentId}/`),
  getUnifiedProfile: (identifier: string) =>
    client.get<UnifiedProfile>(`/v4/institutional/profile/${identifier}/`),

  // Retention Radar (Renege)
  getRenegeRadar: () =>
    client.get<{
      total_placed_monitored: number;
      critical_count: number;
      moderate_count: number;
      low_count: number;
      avg_renege_probability: number;
      candidates: RenegeCandidate[];
    }>('/tpo/insights/renege/'),
  resolveRenege: (studentId: string, action: string, notes?: string) =>
    client.post('/renege-radar/resolve/', { student_id: studentId, action, notes }),

  // Fairness Audit
  getFairnessAudit: () =>
    client.get<{
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
    }>('/tpo/insights/fairness/'),

  // Reports
  getReports: () => client.get<any>('/tpo/insights/reports/'),

  // What-If Career Simulation
  runWhatIfSimulation: (payload: {
    student_id: string;
    hypothetical_cgpa?: number;
    resolved_backlogs?: number;
    additional_skills?: string[];
  }) => client.post<WhatIfResult>('/tpo/insights/whatif/', payload),

  // ML Model Registry & Retraining
  getModelRegistry: () =>
    client.get<{ total_models: number; models: any[] }>('/tpo/models/'),
  retrainModels: () =>
    client.post<{ success: boolean; message: string; metrics: any }>('/tpo/models/retrain/'),
};

export const api = tpoApi;
