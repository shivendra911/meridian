export interface VtiScore {
  score: number;
  badge: string;
  badge_class: 'gold' | 'silver' | 'bronze';
  breakdown: {
    cgpa_score: number;
    backlog_score: number;
    tier_score: number;
    skills_score: number;
  };
  summary: string;
}

export interface Student {
  student_id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  year: number;
  cgpa: number;
  backlogs: number;
  skills: string[];
  placement_status: 'Placed' | 'Unplaced';
  highest_tier?: 'Normal' | 'Dream' | 'Super Dream';
  ml_opt_out?: boolean;
  vti?: VtiScore;
  ai_risk?: {
    placement_probability: number;
    expected_package_lpa: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface JobEligibility {
  min_cgpa: number;
  max_backlogs: number;
  departments: string[];
}

export interface Job {
  job_id: string;
  company_id: string;
  title: string;
  tier: 'Normal' | 'Dream' | 'Super Dream';
  package_lpa: number;
  vacancies: number;
  filled: number;
  status: 'Open' | 'Closed';
  deadline?: string;
  eligibility: JobEligibility;
}

export interface Company {
  company_id: string;
  name: string;
  industry: string;
  location: string;
  website?: string;
  contact_email?: string;
}

export interface Application {
  application_id: string;
  student_id: string;
  job_id: string;
  status: 'Applied' | 'Shortlisted' | 'Interviewing' | 'Selected' | 'Rejected';
  applied_at: string;
  student?: Student;
  job?: Job;
  note?: string;
  student_name?: string;
  department?: string;
  cgpa?: number;
  job_title?: string;
  company_name?: string;
  company_id?: string;
  package_lpa?: number;
  application_date?: string;
}

export interface Interview {
  interview_id: string;
  application_id: string;
  student_id: string;
  round: string;
  scheduled_start: string;
  scheduled_end: string;
  mode: 'In-Person' | 'Virtual';
  venue?: string;
  result: 'Scheduled' | 'Passed' | 'Failed';
  was_rescheduled?: boolean;
}

export interface Placement {
  placement_id: string;
  student_id: string;
  job_id: string;
  company_id: string;
  package_lpa: number;
  tier: string;
  placement_date: string;
}

export interface ActivityEvent {
  event_type: string;
  entity_id: string;
  message: string;
  at: string;
}

export interface OverviewData {
  kpis: {
    total_students: number;
    placement_pct: number;
    total_companies: number;
    open_jobs: number;
    total_applications: number;
    offers_selected: number;
    average_package_lpa: number;
    highest_package_lpa: number;
    top_hiring_company: string;
  };
  top_roles: Array<{
    title: string;
    location: string;
    package_lpa: number;
    tier: string;
  }>;
  pipeline_health: Array<{
    status: string;
    n: number;
    pct: number;
  }>;
  recent_activity: ActivityEvent[];
  branch_velocity: {
    labels: string[];
    rates: number[];
    rows: Array<{
      department: string;
      total_students: number;
      placed_students: number;
      placement_pct: number;
      avg_package: number;
    }>;
  };
  tier_distribution: {
    labels: string[];
    counts: number[];
  };
  cluster_status: {
    mongo_live: boolean;
    replica_set: string;
    version: string;
  };
}

export interface SuperdayConflict {
  type: 'CANDIDATE_CLASH' | 'VENUE_CLASH';
  severity: 'CRITICAL' | 'HIGH';
  student_id?: string;
  venue?: string;
  interview_a: string;
  interview_b: string;
  start_a: string;
  end_a: string;
  start_b: string;
  end_b: string;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  autonomy_level: 'L0' | 'L1' | 'L2';
  description: string;
  allowed_tools: string[];
}

export interface AgentRun {
  run_id: string;
  agent_id: string;
  agent_name: string;
  autonomy_level: string;
  goal: string;
  plan: string[];
  tool_calls: Array<{
    tool: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
  }>;
  output: string;
  executed_at: string;
  status: string;
}

export interface WhatIfResult {
  student_id: string;
  opted_out: boolean;
  message?: string;
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
}

export interface NirfMetrics {
  academic_session: string;
  cohort_size: number;
  placed_count: number;
  placement_pct: number;
  higher_studies_count: number;
  higher_studies_pct: number;
  combined_outcome_pct: number;
  gph_score_40: number;
  salary_stats: {
    min_lpa: number;
    median_lpa: number;
    mean_lpa: number;
    max_lpa: number;
  };
  gms_score_40: number;
  total_nirf_go_80: number;
  company_table: Array<{
    company_id: string;
    recruited_count: number | string;
    raw_count: number;
    min_salary_lpa: number;
    median_salary_lpa: number;
    max_salary_lpa: number;
  }>;
  methodology: string;
}

export interface ConsentRecord {
  consent_id?: string;
  student_id: string;
  purpose: string;
  purpose_title: string;
  status: 'ACTIVE' | 'WITHDRAWN' | 'PENDING' | 'GRANTED_BY_DEFAULT';
  notice_version: string;
  disclosed_fields: string[];
  granted_at?: string | null;
  withdrawn_at?: string | null;
  is_mandatory: boolean;
  description: string;
}

export interface RenegeCandidate {
  student_id: string;
  name: string;
  department: string;
  placed_company: string;
  package_lpa: number;
  dept_avg_package: number;
  salary_ratio: number;
  post_offer_apps_count: number;
  renege_probability: number;
  risk_level: 'LOW' | 'MODERATE' | 'CRITICAL';
  recommended_action: string;
}

// CAMP-01: Tenant & Institution Architecture Types
export interface PlatformTenant {
  id: string;
  slug: string;
  name: string;
  status: 'REQUESTED' | 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSING' | 'CLOSED';
  customer_type: string;
  admin_email: string;
  subscription_tier?: string;
  created_at: string;
}

export interface PlatformInstitution {
  id?: string;
  tenant_id: string;
  institution_id: string;
  institution_code: string;
  normalized_code: string;
  legal_name: string;
  display_name: string;
  institution_type: string;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  timezone: string;
  default_locale: string;
  classifications: {
    institution_kind: string;
    ownership: string;
    governance: string;
    recognition_status: string;
    institutional_role: string;
    delivery_model: string;
  };
  contact_email?: string;
  website_url?: string;
}

export interface Campus {
  id?: string;
  campus_id: string;
  tenant_id: string;
  campus_code: string;
  campus_name: string;
  campus_kind: string;
  status: string;
  timezone: string;
}

export interface OrganizationalTreeNode {
  unit_id: string;
  unit_code: string;
  name: string;
  unit_type: string;
  children: OrganizationalTreeNode[];
}

export interface ReadinessChecklistItem {
  criterion: string;
  passed: boolean;
  required: boolean;
}

export interface ReadinessReport {
  institution_id: string;
  tenant_id: string;
  is_ready_for_activation: boolean;
  checklist: ReadinessChecklistItem[];
  failed_criteria: string[];
}


