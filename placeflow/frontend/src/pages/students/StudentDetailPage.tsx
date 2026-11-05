import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Student, Job, Application, Interview, ConsentRecord } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { VtiBadge } from '../../components/common/VtiBadge';
import { WhatIfPage } from '../WhatIfPage';
import { ConsentPage } from '../ConsentPage';
import { resolveCompanyName } from '../../utils/formatters';
import {
  User,
  GraduationCap,
  Briefcase,
  FileText,
  Sliders,
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [studentId] = useState<string>(id || 'STU001');

  const [student, setStudent] = useState<Student | null>(null);
  const [eligibleJobs, setEligibleJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [aiPred, setAiPred] = useState<Student['ai_risk'] | null>(null);
  const [skillRecs, setSkillRecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'eligibility' | 'simulate' | 'consent'>('profile');

  const loadData = () => {
    if (!studentId) return;
    setLoading(true);
    api
      .getStudent(studentId)
      .then((res) => {
        setStudent(res.student);
        setEligibleJobs(res.eligible_jobs || []);
        setApplications(res.applications || []);
        setInterviews(res.interviews || []);
        setAiPred(res.ai_prediction || null);
        setSkillRecs(res.skill_recommendations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <EmptyState
        icon={User}
        title="Candidate record not found"
        description={`No student profile located with ID "${studentId}".`}
        actionLabel="Back to Students Registry"
        onAction={() => navigate('/students')}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title={student.name}
        description={`${student.student_id} • ${student.department} Engineering • Class of ${student.year} • ${student.email}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/students')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Directory
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('simulate')}
            >
              <Sliders className="h-4 w-4 mr-1.5" />
              What-If Simulator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('consent')}
            >
              <Shield className="h-4 w-4 mr-1.5" />
              Consents
            </Button>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cumulative GPA"
          value={student.cgpa?.toFixed(2)}
          hint={student.backlogs === 0 ? 'Clear standing (0 backlogs)' : `${student.backlogs} active backlogs`}
        />
        <StatCard
          label="Placement Status"
          value={student.placement_status}
          hint={student.highest_tier ? `Highest: ${student.highest_tier}` : 'Active candidate'}
        />
        <StatCard
          label="Eligible Openings"
          value={eligibleJobs.length}
          hint="Matching criteria currently"
        />
        <StatCard
          label="Applications / Stages"
          value={applications.length}
          hint={`${interviews.length} interview rounds`}
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'applications', label: `Applications (${applications.length})` },
          { id: 'eligibility', label: `Eligibility (${eligibleJobs.length})` },
          { id: 'simulate', label: 'Simulate' },
          { id: 'consent', label: 'Consent' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Tab Contents */}
      {activeTab === 'simulate' ? (
        <WhatIfPage studentId={studentId} onBack={() => setActiveTab('profile')} />
      ) : activeTab === 'consent' ? (
        <ConsentPage initialStudentId={studentId} />
      ) : activeTab === 'applications' ? (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No active applications logged"
              description="Candidate has not yet submitted applications to registered placement drives."
            />
          ) : (
            <div className="border border-line rounded-lg overflow-hidden bg-surface">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-canvas text-ink-muted font-medium uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">App ID</th>
                    <th className="px-4 py-3">Drive / Role</th>
                    <th className="px-4 py-3">Package / Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {applications.map((app) => (
                    <tr key={app.application_id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-brand">
                        {app.application_id}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-ink">
                        {app.job_title || app.job?.title || app.job_id}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-ink">
                        {app.package_lpa || app.job?.package_lpa ? `₹${app.package_lpa || app.job?.package_lpa} LPA` : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            app.status === 'Selected'
                              ? 'success'
                              : app.status === 'Interviewing'
                              ? 'info'
                              : app.status === 'Rejected'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-ink-muted text-[11px]">
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'eligibility' ? (
        <div className="space-y-4">
          {eligibleJobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No eligible drives at this moment"
              description="Candidate does not meet current criteria or all eligible drives have closed."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibleJobs.map((job) => (
                <Card key={job.job_id} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-ink text-sm">{job.title}</h4>
                      <Badge variant="institutional" size="xs">{job.tier}</Badge>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">Company: {resolveCompanyName(job.company_id)}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-ink">
                      <span className="font-mono font-semibold text-success">₹{job.package_lpa} LPA</span>
                      <span className="text-ink-muted">•</span>
                      <span>Min CGPA: {job.eligibility?.min_cgpa}</span>
                      <span className="text-ink-muted">•</span>
                      <span>Max Backlogs: {job.eligibility?.max_backlogs}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                    <span className="text-[11px] text-ink-muted">{job.vacancies} vacancies</span>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => navigate(`/placement/drives/${job.job_id}`)}
                    >
                      View Drive
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Profile Tab (2/3 main + 1/3 side layout) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Academic & Verification Record */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-brand" />
                Academic Dossier & Credentials
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-canvas rounded border border-line">
                  <span className="text-ink-muted text-[11px] uppercase tracking-wider block">Department</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block">{student.department}</span>
                </div>
                <div className="p-3 bg-canvas rounded border border-line">
                  <span className="text-ink-muted text-[11px] uppercase tracking-wider block">CGPA</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block font-mono">{student.cgpa?.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-canvas rounded border border-line">
                  <span className="text-ink-muted text-[11px] uppercase tracking-wider block">Backlogs</span>
                  <span className={`font-semibold text-sm mt-0.5 block font-mono ${student.backlogs > 0 ? 'text-danger' : 'text-success'}`}>
                    {student.backlogs}
                  </span>
                </div>
                <div className="p-3 bg-canvas rounded border border-line">
                  <span className="text-ink-muted text-[11px] uppercase tracking-wider block">Batch Year</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block font-mono">{student.year}</span>
                </div>
                <div className="p-3 bg-canvas rounded border border-line sm:col-span-2">
                  <span className="text-ink-muted text-[11px] uppercase tracking-wider block">Email Address</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block font-mono">{student.email}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="mt-5 pt-4 border-t border-line">
                <span className="text-xs font-semibold text-ink block mb-2">Verified Skill Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {(student.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-canvas border border-line rounded text-xs text-ink font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* AI Career Risk & Placement Probability */}
            {aiPred && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand" />
                  Predictive Career Telemetry (CAMP AI Engine)
                </h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-canvas rounded border border-line">
                    <span className="text-ink-muted text-[11px] block">Placement Probability</span>
                    <span className="font-semibold text-ink text-base mt-1 block font-mono">
                      {Math.round(aiPred.placement_probability * 100)}%
                    </span>
                  </div>
                  <div className="p-3 bg-canvas rounded border border-line">
                    <span className="text-ink-muted text-[11px] block">Expected Package</span>
                    <span className="font-semibold text-success text-base mt-1 block font-mono">
                      ₹{aiPred.expected_package_lpa?.toFixed(1)} LPA
                    </span>
                  </div>
                  <div className="p-3 bg-canvas rounded border border-line">
                    <span className="text-ink-muted text-[11px] block">Risk Classification</span>
                    <span className="mt-1 block">
                      <Badge
                        variant={
                          aiPred.risk_level === 'LOW'
                            ? 'success'
                            : aiPred.risk_level === 'MEDIUM'
                            ? 'warning'
                            : 'danger'
                        }
                        size="xs"
                      >
                        {aiPred.risk_level} RISK
                      </Badge>
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Rail: VTI Authenticity & Recommendations */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-brand" />
                Verified Talent Index (VTI)
              </h3>
              {student.vti ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <VtiBadge vti={student.vti} />
                    <span className="font-mono text-sm font-bold text-ink">
                      {student.vti.score} / 100
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {student.vti.summary}
                  </p>
                  <div className="pt-3 border-t border-line space-y-2 text-xs">
                    <div className="flex justify-between text-ink-muted">
                      <span>Academic GPA Score:</span>
                      <span className="font-mono text-ink">{student.vti.breakdown.cgpa_score}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Backlog Clearance:</span>
                      <span className="font-mono text-ink">{student.vti.breakdown.backlog_score}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Skills Validation:</span>
                      <span className="font-mono text-ink">{student.vti.breakdown.skills_score}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Hiring Tier Weight:</span>
                      <span className="font-mono text-ink">{student.vti.breakdown.tier_score}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-muted">No VTI certification issued yet.</p>
              )}
            </Card>

            {skillRecs.length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-ink mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand" />
                  Recommended Skills
                </h3>
                <p className="text-xs text-ink-muted mb-3">
                  AI-identified skill enhancements to unlock higher hiring tiers:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skillRecs.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 bg-line/50 border border-line rounded text-xs text-ink font-medium"
                    >
                      + {sk}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
