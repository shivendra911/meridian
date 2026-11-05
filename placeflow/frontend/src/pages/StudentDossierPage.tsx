import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Student, Job, Application, Interview } from '../types';
import { VtiBadge } from '../components/common/VtiBadge';
import {
  ArrowLeft,
  Sliders,
  Shield,
  Activity,
  Briefcase,
  FileText,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface StudentDossierPageProps {
  studentId: string;
  onBack: () => void;
  onOpenWhatIf: (studentId: string) => void;
  onOpenConsent: (studentId: string) => void;
}

export const StudentDossierPage: React.FC<StudentDossierPageProps> = ({
  studentId,
  onBack,
  onOpenWhatIf,
  onOpenConsent,
}) => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [eligibleJobs, setEligibleJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [aiPred, setAiPred] = useState<Student['ai_risk'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getStudent(studentId)
      .then((res) => {
        setStudent(res.student);
        setEligibleJobs(res.eligible_jobs);
        setApplications(res.applications);
        setInterviews(res.interviews);
        setAiPred(res.ai_prediction || null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Loading Candidate Career Dossier...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-sm flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Failed to load dossier: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-cardinal transition-colors"
      >
        <ArrowLeft size={13} />
        <span>Back to Candidate Directory</span>
      </button>

      {/* Candidate Dossier Header Banner */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold font-serif text-xl border-2 border-slate-200 shadow-xs">
            {student.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-0.5">
              OFFICIAL ACADEMIC CANDIDATE DOSSIER
            </div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 m-0">{student.name}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 font-mono">
              <span className="font-bold text-navy-900">{student.student_id}</span>
              <span>&bull;</span>
              <span>{student.department} (Class of {student.year})</span>
              <span>&bull;</span>
              <span>CGPA: <strong>{student.cgpa.toFixed(2)}</strong></span>
              <span>&bull;</span>
              <span>
                Backlogs:{' '}
                <strong className={student.backlogs > 0 ? 'text-red-600' : 'text-emerald-700'}>
                  {student.backlogs}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Badges */}
        <div className="flex flex-col sm:items-end gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenWhatIf(student.student_id)}
              className="px-3 py-1.5 bg-cardinal text-white text-xs font-semibold rounded hover:bg-cardinal-dark shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Sliders size={13} />
              <span>What-If Simulator</span>
            </button>
            <button
              onClick={() => onOpenConsent(student.student_id)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Shield size={13} />
              <span>DPDP Consents</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                student.placement_status === 'Placed'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  student.placement_status === 'Placed' ? 'bg-emerald-600' : 'bg-slate-400'
                }`}
              ></span>
              {student.placement_status}
              {student.highest_tier && ` • ${student.highest_tier}`}
            </span>
            <VtiBadge vti={student.vti} />
          </div>
        </div>
      </div>

      {/* Diagnostic & ML Risk Card */}
      {aiPred && (
        <div className="bg-white border-l-4 border-l-emerald-600 border border-slate-200 rounded p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <TrendingUp size={15} className="text-emerald-600" />
              <span>Placement Diagnostic &amp; Predictive Competency Analytics</span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-semibold font-mono ${
                aiPred.risk_level === 'LOW'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : aiPred.risk_level === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              Risk Assessment: {aiPred.risk_level}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <div className="text-[10.5px] text-slate-500 uppercase font-medium">Placement Likelihood</div>
              <div className="text-lg font-bold font-mono text-emerald-700">
                {aiPred.placement_probability}%
              </div>
            </div>
            <div>
              <div className="text-[10.5px] text-slate-500 uppercase font-medium">Expected CTC</div>
              <div className="text-lg font-bold font-mono text-slate-900">
                ₹{aiPred.expected_package_lpa} LPA
              </div>
            </div>
            <div>
              <div className="text-[10.5px] text-slate-500 uppercase font-medium">Active Applications</div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {applications.length}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] text-slate-500 uppercase font-medium">Eligible Openings</div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {eligibleJobs.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eligible Drives & Application History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eligible Job Openings */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <Briefcase size={15} className="text-navy-900" />
            <h2 className="text-sm font-bold font-serif text-slate-900 m-0">
              Matching Active Recruitment Drives ({eligibleJobs.length})
            </h2>
          </div>

          {eligibleJobs.length === 0 ? (
            <div className="text-xs text-slate-500 p-4 text-center">
              No matching openings satisfy candidate CGPA and department criteria.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {eligibleJobs.map((job) => (
                <div
                  key={job.job_id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{job.title}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {job.company_id} &bull; Min CGPA: {job.eligibility.min_cgpa.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-cardinal">
                      ₹{job.package_lpa} LPA
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 font-medium">
                      {job.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Application History */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <FileText size={15} className="text-navy-900" />
            <h2 className="text-sm font-bold font-serif text-slate-900 m-0">
              Candidate Application Ledger ({applications.length})
            </h2>
          </div>

          {applications.length === 0 ? (
            <div className="text-xs text-slate-500 p-4 text-center">
              Candidate has not submitted applications for active campus drives.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {applications.map((app) => (
                <div
                  key={app.application_id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 font-mono">
                      {app.job_id}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Applied: {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Active'}
                    </div>
                  </div>
                  <span
                    className={`text-[10.5px] px-2 py-0.5 rounded font-semibold font-mono ${
                      app.status === 'Selected'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : app.status === 'Shortlisted'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Interview Rounds */}
      {interviews.length > 0 && (
        <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <Calendar size={15} className="text-navy-900" />
            <h2 className="text-sm font-bold font-serif text-slate-900 m-0">
              Scheduled Interview Loops ({interviews.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {interviews.map((iv) => (
              <div
                key={iv.interview_id}
                className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">{iv.round}</div>
                  <div className="text-[11px] text-slate-500">
                    {iv.mode} at {iv.venue || 'Campus Placement Center'}
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-slate-700">
                  {new Date(iv.scheduled_start).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

