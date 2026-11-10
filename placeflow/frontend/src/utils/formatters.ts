export const COMPANY_NAME_MAP: Record<string, string> = {
  COMP001: 'Cognizant',
  COMP002: 'Zoho',
  COMP003: 'Razorpay',
  COMP004: 'Google India',
  COMP005: 'Microsoft India',
};

export function resolveCompanyName(idOrName?: string): string {
  if (!idOrName) return 'Recruiting Partner';
  return COMPANY_NAME_MAP[idOrName] || idOrName;
}

export function formatLpa(val?: number): string {
  if (val === undefined || val === null) return '—';
  return `₹${val.toFixed(1)} LPA`;
}

export function formatFriendlyDate(dateStr?: string): string {
  if (!dateStr) return 'Active';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export interface NormalizedApp {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  cgpa: number;
  jobId: string;
  jobTitle: string;
  companyName: string;
  tier: string;
  packageLpa?: number;
  status: string;
  appliedDate: string;
}

export function normalizeApplication(app: any): NormalizedApp {
  return {
    id: app.application_id || '',
    studentId: app.student_id || '',
    studentName: app.student_name || app.student?.name || app.student_id || 'Candidate',
    department: app.department || app.student?.department || 'CSE',
    cgpa: app.cgpa || app.student?.cgpa || 8.0,
    jobId: app.job_id || '',
    jobTitle: app.job_title || app.job?.title || 'Engineering Role',
    companyName: resolveCompanyName(app.company_name || app.company_id || app.job?.company_id),
    tier: app.tier || app.job?.tier || 'Normal',
    packageLpa: app.package_lpa || app.job?.package_lpa,
    status: app.status || 'Applied',
    appliedDate: formatFriendlyDate(app.application_date || app.applied_at),
  };
}

