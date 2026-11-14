import {
  OverviewData,
  Student,
  Job,
  Company,
  Application,
  Interview,
  Placement,
  SuperdayConflict,
  Agent,
  AgentRun,
  WhatIfResult,
  NirfMetrics,
  ConsentRecord,
  RenegeCandidate,
  PlatformTenant,
  PlatformInstitution,
  Campus,
  OrganizationalTreeNode,
  ReadinessReport,
  FacultyProfile,
  HodProfile,
  HosProfile,
  AdminProfile,
  UnifiedProfile,
  PlacementDrive,
  InstitutionalSummary,
} from './types';

import { client } from './core/api/client';

let currentTenantId: string = localStorage.getItem('placeflow_tenant_id') || '3f0708bc-4852-4900-a0b2-5e27865a36fe';

export function setApiTenantHeader(tenantId: string) {
  currentTenantId = tenantId;
  if (tenantId) {
    localStorage.setItem('placeflow_tenant_id', tenantId);
  }
}

export function getApiTenantHeader(): string {
  return currentTenantId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = ((options.method || 'GET').toUpperCase()) as any;
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;
  return client.request<T>(endpoint, {
    method,
    body,
    headers: options.headers as any,
  });
}

export const api = {
  // Institutional Hierarchy & Faculty Mentorship (CAMP-01/02 Governance)
  getInstitutionalSummary: () => request<InstitutionalSummary>('/v4/institutional/summary/'),
  getSchoolHeads: () => request<{ count: number; school_heads: HosProfile[] }>('/v4/institutional/hos/'),
  getDepartmentHeads: (hos?: string) => {
    const qs = hos ? `?hos=${encodeURIComponent(hos)}` : '';
    return request<{ count: number; department_heads: HodProfile[] }>(`/v4/institutional/hods/${qs}`);
  },
  getFacultyList: (params?: {
    hod_id?: string;
    hos?: string;
    role?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.hod_id) q.append('hod_id', params.hod_id);
    if (params?.hos) q.append('hos', params.hos);
    if (params?.role) q.append('role', params.role);
    if (params?.department) q.append('department', params.department);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.sort) q.append('sort', params.sort);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<{ total_count: number; page: number; total_pages: number; faculty: FacultyProfile[] }>(`/v4/institutional/faculty/${qs}`);
  },
  getFacultyDetail: (facultyId: string) =>
    request<{
      faculty: FacultyProfile;
      roles?: string[];
      teaching?: {
        courses: string[];
        office_location: string;
        academic_rank: string;
        committees: string[];
      };
      appointments?: {
        hod?: HodProfile | null;
        hos?: HosProfile | null;
        admin?: AdminProfile | null;
      };
      colleagues?: Array<{
        faculty_id: string;
        name: string;
        designation: string;
        roles: string[];
        email: string;
      }>;
      network_relationships?: any[];
      mentees_count: number;
      mentees: Student[];
      cohort_breakdown: {
        eligible: number;
        not_eligible: number;
        survey_filled: number;
        survey_pending: number;
        placed_elsewhere: number;
        verification_issues: number;
      };
      action_items: {
        pending_submission: Student[];
        verification_blocked: Student[];
      };
    }>(`/v4/institutional/faculty/${facultyId}/`),
  getAdmins: () => request<{ count: number; admins: AdminProfile[] }>('/v4/institutional/admins/'),
  getAdminDetail: (adminId: string) =>
    request<{
      admin: AdminProfile;
      linked_faculty?: FacultyProfile | null;
      network_relationships: any[];
    }>(`/v4/institutional/admins/${adminId}/`),
  getUnifiedProfile: (identifier: string) =>
    request<UnifiedProfile>(`/v4/institutional/profile/${identifier}/`),
  getDriveAccenture: () => request<{ status: string; drive: PlacementDrive }>('/v4/institutional/drive/accenture/'),
  getInstitutionalRelationships: (nodeId?: string, relType?: string) => {
    const q = new URLSearchParams();
    if (nodeId) q.append('node_id', nodeId);
    if (relType) q.append('relation_type', relType);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<{ count: number; relationships: any[] }>(`/v4/institutional/relationships/${qs}`);
  },

  // Directorate Overview
  getOverview: () => request<OverviewData>('/overview/'),

  // Candidate Registry & Dossiers
  getStudents: (department?: string, search?: string) => {
    const params = new URLSearchParams();
    if (department && department !== 'ALL') params.append('department', department);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ count: number; students: Student[] }>(`/students/${qs}`);
  },
  getStudent: (studentId: string) =>
    request<{
      student: Student;
      vti?: Student['vti'];
      eligible_jobs: Job[];
      applications: Application[];
      interviews: Interview[];
      ai_prediction?: Student['ai_risk'];
      skill_recommendations: string[];
      consents: ConsentRecord[];
    }>(`/students/${studentId}/`),
  addStudent: (data: Partial<Student>) =>
    request<{ status: string; student_id: string; message: string }>('/students/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Corporate Partners & Open JNFs
  getCompanies: () => request<{ count: number; companies: Company[] }>('/companies/'),
  addCompany: (data: Partial<Company>) =>
    request<{ status: string; company_id: string }>('/companies/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getJobs: () => request<{ count: number; jobs: Job[] }>('/jobs/'),
  addJob: (data: Partial<Job>) =>
    request<{ status: string; job_id: string }>('/jobs/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getJobCandidates: (jobId: string) =>
    request<{ job_id: string; candidates: Student[]; count: number }>(`/jobs/${jobId}/candidates/`),

  // Recruitment Operations & Cascading
  getApplications: () => request<{ count: number; applications: Application[] }>('/applications/'),
  applyForJob: (studentId: string, jobId: string) =>
    request<{ status: string; application_id: string }>('/applications/', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, job_id: jobId }),
    }),
  updateApplicationStatus: (applicationId: string, newStatus: string, note?: string) =>
    request<{ status: string; application_id: string; new_status: string }>(
      `/applications/${applicationId}/status/`,
      {
        method: 'POST',
        body: JSON.stringify({ status: newStatus, note }),
      }
    ),
  getInterviews: () => request<{ count: number; interviews: Interview[] }>('/interviews/'),
  scheduleInterview: (data: Partial<Interview>) =>
    request<{ status: string; interview_id: string }>('/interviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPlacements: () => request<{ count: number; placements: Placement[] }>('/placements/'),
  createPlacement: (studentId: string, jobId: string) =>
    request<{ status: string; placement_id: string; cascaded_seat_student_id?: string; message: string }>(
      '/placements/',
      {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId, job_id: jobId }),
      }
    ),

  // Superday Constraint Arbitrator
  getSuperdayConflicts: () =>
    request<{
      clashes_count: number;
      status: string;
      conflicts: SuperdayConflict[];
      interviews: Interview[];
    }>('/superday/conflicts/'),
  resolveSuperdayConflicts: () =>
    request<{ status: string; resolved_count: number; message: string }>('/superday/resolve/', {
      method: 'POST',
    }),

  // Post-Offer Retention Radar
  getRenegeRadar: () =>
    request<{
      total_placed_monitored: number;
      critical_count: number;
      moderate_count: number;
      low_count: number;
      avg_renege_probability: number;
      candidates: RenegeCandidate[];
    }>('/renege-radar/'),

  // Autonomous Agent Multi-Agent Hub
  getAgentCatalog: () =>
    request<{
      agents: Record<string, Agent>;
      tool_catalog: Array<{ name: string; description: string; scope: string }>;
    }>('/agents/'),
  sendAgentChat: (agentId: string, prompt: string, studentId?: string) =>
    request<{
      run_id: string;
      agent_id: string;
      agent_name: string;
      autonomy_level: string;
      plan: string[];
      tool_calls_count: number;
      tool_calls: Array<{ tool: string; args: Record<string, unknown>; result: Record<string, unknown> }>;
      response: string;
      disclaimer: string;
    }>('/agents/chat/', {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId, prompt, ...(studentId ? { student_id: studentId } : {}) }),
    }),
  getAgentRuns: () =>
    request<{
      total_runs: number;
      total_tools_executed: number;
      runs: AgentRun[];
    }>('/agents/runs/'),

  // What-If Career Simulator
  runWhatIfSimulation: (payload: {
    student_id: string;
    hypothetical_cgpa?: number;
    resolved_backlogs?: number;
    additional_skills?: string[];
  }) => request<WhatIfResult>('/whatif/simulate/', { method: 'POST', body: JSON.stringify(payload) }),

  // NIRF Graduation Outcome Calculator
  getNirfMetrics: () => request<NirfMetrics>('/nirf/metrics/'),

  // DPDP Consent Ledger
  getConsents: (studentId: string) =>
    request<{
      student_id: string;
      student_name: string;
      department: string;
      ml_opt_out: boolean;
      notice_version: string;
      consents: ConsentRecord[];
    }>(`/consent/${studentId}/`),
  recordConsent: (studentId: string, purpose: string) =>
    request<{ status: string; consent_id: string; purpose: string }>('/consent/record/', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, purpose }),
    }),
  withdrawConsent: (studentId: string, purpose: string) =>
    request<{ status: string; student_id: string; purpose: string }>('/consent/withdraw/', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, purpose }),
    }),

  // Demographic Slice Fairness Audit
  getFairnessAudit: () =>
    request<{
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
    }>('/fairness/audit/'),

  // Reports
  getReports: () =>
    request<{
      reports_count: number;
      reports: Record<
        string,
        { id: string; title: string; rows_count: number; sample: Record<string, unknown>[] }
      >;
    }>('/reports/'),

  // CAMP-01 Architecture APIs
  getTenants: () =>
    request<{ tenants: PlatformTenant[]; count: number }>('/v4/tenants/'),

  getInstitutions: (tenantId: string) =>
    request<{ institutions: PlatformInstitution[]; count: number }>('/v4/institutions/', {
      headers: { 'X-Tenant-ID': tenantId },
    }),

  getInstitutionReadiness: (tenantId: string, institutionId: string) =>
    request<ReadinessReport>(`/v4/institutions/${institutionId}/readiness/`, {
      headers: { 'X-Tenant-ID': tenantId },
    }),

  getHierarchyTree: (tenantId: string, institutionId: string) =>
    request<{ hierarchy_tree: OrganizationalTreeNode[] }>(`/v4/institutions/${institutionId}/hierarchy/`, {
      headers: { 'X-Tenant-ID': tenantId },
    }),

  getCampuses: (tenantId: string) =>
    request<{ campuses: Campus[] }>('/v4/campuses/', {
      headers: { 'X-Tenant-ID': tenantId },
    }),

  restructureUnitParent: (tenantId: string, institutionId: string, unitId: string, newParentId: string, reason: string) =>
    request<{ relation_id: string }>(`/v4/institutions/${institutionId}/restructure/`, {
      method: 'POST',
      headers: { 'X-Tenant-ID': tenantId },
      body: JSON.stringify({ unit_id: unitId, new_parent_id: newParentId, change_reason: reason }),
    }),

  executeOnboardingPipeline: (data: Record<string, unknown>) =>
    request<{ is_successful: boolean; pipeline_log: Array<{ step: number; title: string; status: string }> }>('/v4/onboard/execute/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  searchDirectory: (query: string = '', state: string = '') => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (state) params.append('state', state);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{
      count: number;
      directory_results: Array<{
        directory_id: string;
        aishe_code: string;
        legal_name: string;
        display_name: string;
        institution_type: string;
        state: string;
        district: string;
        is_verified: boolean;
        website_url?: string;
      }>;
    }>(`/v4/directory/search/${qs}`);
  },

  resolveConfig: (tenantId: string, institutionId?: string, campusId?: string) => {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenant_id', tenantId);
    if (institutionId) params.append('institution_id', institutionId);
    if (campusId) params.append('campus_id', campusId);
    return request<{ resolved_config: Record<string, unknown>; hierarchy: Record<string, unknown> }>(
      `/v4/config/resolve/?${params.toString()}`,
      { headers: { 'X-Tenant-ID': tenantId } }
    );
  },

  // CAMP-02 IAM Client APIs
  getIamIdentities: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ identities: Array<Record<string, any>> }>(`/v4/iam/identities/${qs}`);
  },

  createIamIdentity: (data: Record<string, any>) =>
    request<Record<string, any>>('/v4/iam/identities/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getIamAccounts: () =>
    request<{ accounts: Array<Record<string, any>> }>('/v4/iam/accounts/'),

  lockIamAccount: (accountId: string, reason: string = 'Administrative lockout') =>
    request<{ message: string }>(`/v4/iam/accounts/${accountId}/lock/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  unlockIamAccount: (accountId: string, reason: string = 'Administrative unlock') =>
    request<{ message: string }>(`/v4/iam/accounts/${accountId}/unlock/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getIamMemberships: (institutionId?: string) => {
    const qs = institutionId ? `?institution_id=${institutionId}` : '';
    return request<{ memberships: Array<Record<string, any>> }>(`/v4/iam/memberships/${qs}`);
  },

  setIamMembershipStatus: (membershipId: string, status: string, reason: string) =>
    request<{ message: string }>(`/v4/iam/memberships/${membershipId}/status/`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    }),

  getIamPermissions: (domain?: string) => {
    const qs = domain ? `?domain=${domain}` : '';
    return request<{ count: number; permissions: Array<Record<string, any>> }>(`/v4/iam/permissions/${qs}`);
  },

  getIamRoles: () =>
    request<{ roles: Array<Record<string, any>> }>('/v4/iam/roles/'),

  createIamRole: (data: Record<string, any>) =>
    request<Record<string, any>>('/v4/iam/roles/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getIamAssignments: (membershipId?: string) => {
    const qs = membershipId ? `?membership_id=${membershipId}` : '';
    return request<{ assignments: Array<Record<string, any>> }>(`/v4/iam/assignments/${qs}`);
  },

  assignIamRole: (data: Record<string, any>) =>
    request<Record<string, any>>('/v4/iam/assignments/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  revokeIamAssignment: (assignmentId: string, reason: string = 'Revoked by administrator') =>
    request<{ message: string }>(`/v4/iam/assignments/${assignmentId}/revoke/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getIamDelegations: () =>
    request<{ delegations: Array<Record<string, any>> }>('/v4/iam/delegations/'),

  createIamDelegation: (data: Record<string, any>) =>
    request<Record<string, any>>('/v4/iam/delegations/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  revokeIamDelegation: (delegationId: string, reason: string = 'Delegation revoked') =>
    request<{ message: string }>(`/v4/iam/delegations/${delegationId}/revoke/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getIamSessions: () =>
    request<{ sessions: Array<Record<string, any>> }>('/v4/iam/sessions/'),

  revokeIamSession: (sessionId: string) =>
    request<{ message: string }>(`/v4/iam/sessions/${sessionId}/revoke/`, {
      method: 'POST',
    }),

  checkAuthorization: (membershipId: string, action: string, resource: Record<string, any> = {}) =>
    request<{
      allowed: boolean;
      reason_code: string;
      message: string;
      matched_role_id?: string;
    }>('/v4/iam/authorize/', {
      method: 'POST',
      body: JSON.stringify({ membership_id: membershipId, action, resource }),
    }),

  // Campus AI Layer Endpoints (v4)
  queryAI: (prompt: string, taskType: string = 'POLICY_QA', systemInstruction: string = '') =>
    request<{
      trace_id: string;
      output_text: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      latency_ms: number;
      model_id: string;
      provider: string;
      pip_safe: boolean;
      pii_masked_count: number;
    }>('/v4/ai/query/', {
      method: 'POST',
      body: JSON.stringify({ prompt, task_type: taskType, system_instruction: systemInstruction }),
    }),

  queryRAG: (query: string, category?: string) =>
    request<{
      answer: string;
      citations: Array<{
        doc_title: string;
        version: string;
        section_heading: string;
        source_authority: string;
      }>;
      groundedness_score: number;
      trace_id: string;
      total_tokens: number;
    }>('/v4/ai/rag/', {
      method: 'POST',
      body: JSON.stringify({ query, category }),
    }),

  executeAIAgent: (agentName: string, payload: Record<string, any>) =>
    request<{
      agent_name: string;
      status: string;
      summary: string;
      recommendation: Record<string, any>;
      tool_results: Array<{
        tool_name: string;
        risk_tier: string;
        status: string;
        requires_human_approval: boolean;
        approval_token?: string;
      }>;
      trace_id: string;
    }>('/v4/ai/agent/execute/', {
      method: 'POST',
      body: JSON.stringify({ agent_name: agentName, payload }),
    }),

  getAITraces: (limit: number = 30) =>
    request<{ count: number; traces: Array<Record<string, any>> }>(`/v4/ai/traces/?limit=${limit}`),

  getAIQuotas: () =>
    request<{
      tenant_id: string;
      quota?: Record<string, any>;
      metrics: {
        total_traces: number;
        total_prompt_tokens: number;
        total_completion_tokens: number;
        avg_latency_ms: number;
        pip_blocked_count: number;
      };
    }>('/v4/ai/quotas/'),
};

