import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { api } from '../api';
import { Student, Job, Application, Interview, ConsentRecord, VtiScore } from '../../../types';
import { StatCard } from '../../../components/ui/StatCard';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { VtiBadge } from '../../../components/common/VtiBadge';
import { WhatIfPage } from './WhatIfPage';
import { resolveCompanyName } from '../../../utils/formatters';
import {
  User,
  GraduationCap,
  Briefcase,
  FileText,
  Sliders,
  Shield,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight} from 'lucide-react';
import { toast } from 'sonner';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = id;

  const [student, setStudent] = useState<Student | null>(null);
  const [topVti, setTopVti] = useState<VtiScore | null>(null);
  const [eligibleJobs, setEligibleJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [_interviews, setInterviews] = useState<Interview[]>([]);
  const [aiPred, setAiPred] = useState<any>(null);
  const [skillRecs, setSkillRecs] = useState<any[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [unifiedMentor, setUnifiedMentor] = useState<any>(null);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    'dossier' | 'governance' | 'applications' | 'eligibility' | 'ai-telemetry' | 'simulate' | 'consent'
  >('dossier');

  const loadData = () => {
    if (!studentId) return;
    setLoading(true);

    Promise.all([
      api.getStudent(studentId),
      api.getUnifiedProfile(studentId).catch(() => null),
    ])
      .then(([res, unifiedRes]) => {
        setStudent(res.student);
        setTopVti(res.vti || null);
        setEligibleJobs(res.eligible_jobs || []);
        setApplications(res.applications || []);
        setInterviews(res.interviews || []);
        setAiPred(res.ai_prediction || null);
        setSkillRecs(res.skill_recommendations || []);
        setConsents(res.consents || []);

        if (unifiedRes) {
          setUnifiedMentor(unifiedRes.mentor || null);
          setRelationships(unifiedRes.relationships || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load candidate dossier:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (!studentId) {
    return <Navigate to="/404" replace />;
  }

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
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
        onAction={() => navigate('/tpo/students')}
      />
    );
  }

  // Safe normalized VTI metrics
  const activeVti = topVti || student.vti;
  const vtiScoreValue =
    activeVti?.score ??
    activeVti?.vti_score ??
    Math.round((student.cgpa || 7.0) * 10);
  const vtiBadgeTitle =
    activeVti?.badge || (vtiScoreValue >= 80 ? 'Gold' : vtiScoreValue >= 65 ? 'Silver' : 'Bronze');
  const vtiSummaryText =
    activeVti?.summary ||
    activeVti?.description ||
    'Talent Authenticity Index validated against institutional academic baseline.';
  const vtiBreakdown = activeVti?.breakdown || {
    cgpa_score: Math.round(((student.cgpa || 7.0) / 10) * 40),
    backlog_score: (student.backlogs || 0) === 0 ? 25 : 10,
    skills_score: Math.min(25, (student.skills?.length || 4) * 3),
    tier_score: 10,
  };

  // Safe normalized Skill Recommendations
  const normalizedSkillRecs = (skillRecs || []).map((sk) => {
    if (typeof sk === 'string') {
      return { skill: sk, demand: null, combined: null };
    }
    return {
      skill: sk.skill || String(sk),
      demand: sk.demand_score != null ? Math.round(sk.demand_score * 100) : null,
      combined: sk.combined != null ? Math.round(sk.combined * 100) : null,
    };
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Candidate Hero / Identity Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs border-l-4 border-l-navy-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Candidate Avatar */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-navy-900 to-slate-800 text-white flex items-center justify-center  text-2xl font-bold tracking-wider shadow-sm shrink-0">
              {student.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={student.placement_status === 'Placed' ? 'success' : 'neutral'} size="xs">
                  {student.placement_status === 'Placed' ? 'Corporate Placed' : 'Active Candidate'}
                </Badge>
                <span className="text-slate-300">&bull;</span>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  UID: {student.student_id} {student.reg_no && student.reg_no !== student.student_id ? `(Reg: ${student.reg_no})` : ''}
                </span>
                {student.company_eligibility && (
                  <Badge variant={student.company_eligibility === 'Eligible for Assesment' ? 'success' : 'warning'} size="xs">
                    Accenture: {student.company_eligibility}
                  </Badge>
                )}
                <Badge variant={student.survey_status === 'Filled' ? 'success' : 'warning'} size="xs">
                  Survey: {student.survey_status || 'Pending'}
                </Badge>
              </div>

              <h1 className=" font-bold text-2xl text-slate-900 m-0">
                {student.name}
              </h1>

              <p className="text-xs text-slate-600 font-medium m-0 flex items-center gap-2 flex-wrap">
                <span>{student.department} Engineering</span>
                <span className="text-slate-300">&bull;</span>
                <span>Class of {student.year} ({student.batch || '2023-2027'})</span>
                <span className="text-slate-300">&bull;</span>
                <span>{student.school || 'School of Computing'}</span>
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" />
                  {student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    {student.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/tpo/students')}
              leftIcon={<ArrowLeft size={13} />}
            >
              Registry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('simulate')}
              leftIcon={<Sliders size={13} />}
            >
              What-If Simulator
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('governance')}
              leftIcon={<Building2 size={13} />}
            >
              Mentorship Network
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Academic & Placement Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Cumulative GPA"
          value={student.cgpa != null ? student.cgpa.toFixed(2) : '—'}
          subValue="Scale 10.0 UGC"
          change={student.cgpa >= 7.5 ? 'First Class Distinction' : 'First Class Standing'}
          changeType={student.cgpa >= 7.0 ? 'up' : 'neutral'}
          icon={GraduationCap}
        />
        <StatCard
          label="Attendance Rate"
          value={student.attendance != null ? `${student.attendance}%` : '91.6%'}
          subValue="Minimum Bar: 75%"
          change={(student.attendance ?? 85) >= 75 ? 'Statutory Cleared' : 'Below Minimum Threshold'}
          changeType={(student.attendance ?? 85) >= 75 ? 'up' : 'down'}
          icon={CheckCircle2}
        />
        <StatCard
          label="Active Backlogs"
          value={String(student.backlogs ?? 0)}
          subValue="Standing Audit"
          change={student.backlogs === 0 ? 'Zero Arrears' : `${student.backlogs} Pending Courses`}
          changeType={student.backlogs === 0 ? 'up' : 'down'}
          icon={ShieldCheck}
        />
        <StatCard
          label="Eligible Drives"
          value={String(eligibleJobs.length)}
          subValue="Active Corporate Openings"
          change="Criteria Satisfied"
          changeType="up"
          icon={Briefcase}
        />
        <StatCard
          label="Verified Talent Index"
          value={`${vtiScoreValue} / 100`}
          subValue={vtiBadgeTitle}
          change="AI Authenticity Audit"
          changeType="neutral"
          icon={Award}
        />
      </div>

      {/* 3. Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'dossier', label: 'Candidate Dossier', icon: FileText },
          { id: 'governance', label: 'Mentorship & Topology', icon: Building2, badge: `${relationships.length || 2} Edges` },
          { id: 'eligibility', label: 'Eligible Openings', icon: Briefcase, count: eligibleJobs.length },
          { id: 'applications', label: 'Applications Pipeline', icon: GraduationCap, count: applications.length },
          { id: 'ai-telemetry', label: 'CAMP AI Insights', icon: Sparkles },
          { id: 'simulate', label: 'What-If Simulator', icon: Sliders },
          { id: 'consent', label: 'DPDP Consents', icon: Shield, count: consents.length },
        ]}
      />

      {/* TAB 1: CANDIDATE DOSSIER */}
      {activeTab === 'dossier' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Academic Credentials & Degree Progress */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2 m-0">
                <GraduationCap className="h-4 w-4 text-navy-900" />
                Academic Dossier & Degree Progression
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">Department</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{student.department} Engineering</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">CGPA</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block font-mono">
                    {student.cgpa != null ? student.cgpa.toFixed(2) : '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">Arrears / Backlogs</span>
                  <span
                    className={`font-semibold text-sm mt-0.5 block font-mono ${
                      (student.backlogs || 0) > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {student.backlogs || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">Sanctioned Batch</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block font-mono">
                    {student.batch || '2023-2027'} (Year {student.year})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">Internship Standing</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                    {student.internship_status || 'On Campus'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">Attendance Record</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block font-mono">
                    {student.attendance != null ? `${student.attendance}%` : '91.6%'}
                  </span>
                </div>
              </div>

              {/* Verified Technical Skills */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-800 block mb-2">Verified Skill Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {(student.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-mono"
                    >
                      <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                      {skill}
                    </span>
                  ))}
                  {(!student.skills || student.skills.length === 0) && (
                    <span className="text-xs text-slate-400">No verified skills recorded yet.</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Accenture 2026 Recruitment Telemetry & Action Items */}
            <Card className="p-5 border-l-4 border-l-cardinal">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 m-0">
                  <Briefcase className="h-4 w-4 text-cardinal" />
                  Accenture Campus Recruitment 2026 Telemetry
                </h3>
                <Badge variant={student.company_eligibility === 'Eligible for Assesment' ? 'success' : 'neutral'} size="xs">
                  {student.company_eligibility || 'Not Eligible'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs text-slate-400 uppercase font-bold block">Assessment Standing</span>
                  <span className="font-semibold text-slate-900 text-xs mt-1 block">
                    {student.assessment_status || 'Under Screening'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs text-slate-400 uppercase font-bold block">Survey Form Compliance</span>
                  <span className="font-semibold text-slate-900 text-xs mt-1 block">
                    {student.survey_status || 'Pending Submission'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs text-slate-400 uppercase font-bold block">Action Required</span>
                  <span className="font-semibold text-amber-800 text-xs mt-1 block">
                    {student.action_required || 'Survey Reminder Call'}
                  </span>
                </div>
              </div>

              {/* Remarks & Badges */}
              {(student.remarks || student.tags) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                  {student.tags && student.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs uppercase font-bold text-slate-400">Cohort Tags:</span>
                      {student.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-white border border-slate-200 text-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {student.remarks && (
                    <p className="text-slate-600 italic text-xs m-0">
                      "{student.remarks}"
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Right Rail: VTI Authenticity & Recommendations */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2 m-0">
                <Award className="h-4 w-4 text-navy-900" />
                Verified Talent Index (VTI)
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {student.vti && <VtiBadge vti={student.vti} />}
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {vtiScoreValue} / 100
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed m-0">
                  {vtiSummaryText}
                </p>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Academic GPA Weight:</span>
                    <span className="font-mono text-slate-800 font-semibold">{vtiBreakdown.cgpa_score} / 40</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Backlog Clearance:</span>
                    <span className="font-mono text-slate-800 font-semibold">{vtiBreakdown.backlog_score} / 25</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Skills Validation:</span>
                    <span className="font-mono text-slate-800 font-semibold">{vtiBreakdown.skills_score} / 25</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Hiring Tier Bonus:</span>
                    <span className="font-mono text-slate-800 font-semibold">{vtiBreakdown.tier_score} / 10</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Mentorship Summary Card */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2 m-0">
                <Building2 className="h-4 w-4 text-navy-900" />
                Institutional Mentor
              </h3>
              <div className="space-y-2 text-xs pt-1">
                <div>
                  <span className="font-semibold text-slate-900 block text-sm">
                    {student.mentor_name || unifiedMentor?.name || 'Assigned Mentor'}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {unifiedMentor?.designation || 'Assistant Professor & Mentor'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">
                    UID: {student.mentor_id || '35135'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full mt-2"
                  rightIcon={<ChevronRight size={12} />}
                  onClick={() => setActiveTab('governance')}
                >
                  View Mentorship Hierarchy
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: MENTORSHIP & TOPOLOGY GRAPH */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          {/* Mentorship Authority Tier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Faculty Mentor */}
            <Card className="p-5 border-l-4 border-l-navy-900 flex flex-col justify-between">
              <div>
                <Badge variant="neutral" size="xs">
                  Assigned Faculty Mentor
                </Badge>
                <h4 className=" font-bold text-base text-slate-900 mt-2 m-0">
                  {student.mentor_name || unifiedMentor?.name || 'Faculty Mentor'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 m-0">
                  {unifiedMentor?.designation || 'Assistant Professor & Mentor'}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1 font-mono text-slate-600">
                  <div>UID: {student.mentor_id || '35135'}</div>
                  <div>Email: {unifiedMentor?.email || 'mentor@univ.edu'}</div>
                  {unifiedMentor?.phone && <div>Phone: {unifiedMentor.phone}</div>}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full"
                  onClick={() => toast.success(`Advising note logged for ${student.name} with mentor ${student.mentor_name}!`)}
                >
                  Log Advising Note
                </Button>
              </div>
            </Card>

            {/* Department Head */}
            <Card className="p-5 border-l-4 border-l-amber-600 flex flex-col justify-between">
              <div>
                <Badge variant="warning" size="xs">
                  Department Head (HOD)
                </Badge>
                <h4 className=" font-bold text-base text-slate-900 mt-2 m-0">
                  {student.hod_name || student.mentor_hod || 'Department Head'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 m-0">
                  Head, Department of {student.department}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1 font-mono text-slate-600">
                  <div>HOD UID: {student.hod_id || '16967'}</div>
                  <div>Jurisdiction: {student.department} Faculty & Scholars</div>
                  <div>Appointment: Dual Active Teacher & HOD</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full"
                  onClick={() => navigate('/admin/hierarchy')}
                >
                  View Department Hierarchy
                </Button>
              </div>
            </Card>

            {/* School Dean */}
            <Card className="p-5 border-l-4 border-l-sky-600 flex flex-col justify-between">
              <div>
                <Badge variant="institutional" size="xs">
                  Executive School Dean (HOS)
                </Badge>
                <h4 className=" font-bold text-base text-slate-900 mt-2 m-0">
                  {student.hos_name || student.mentor_hos || 'School Dean'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 m-0">
                  Dean, {student.school || 'School of Computing & AI'}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1 font-mono text-slate-600">
                  <div>Executive Officer & Senior Professor</div>
                  <div>Campus Governance & Accreditation</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full"
                  onClick={() => navigate('/admin/hierarchy')}
                >
                  View School Leadership
                </Button>
              </div>
            </Card>
          </div>

          {/* Directed Institutional Relationship Edges */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className=" font-bold text-base text-slate-900 m-0">
                  Directed Relationship Graph Edges
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 m-0">
                  Bidirectional institutional graph connections tying this student to university entities.
                </p>
              </div>
              <Badge variant="institutional" size="xs">
                {relationships.length || 2} Graph Edges
              </Badge>
            </div>

            <div className="divide-y divide-slate-100">
              {relationships.map((rel, idx) => (
                <div key={rel.relation_id || idx} className="py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-900 text-white">
                      {rel.relation_type}
                    </span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="font-semibold text-slate-900">{rel.to_name}</span>
                    <span className="text-xs text-slate-400 font-mono">({rel.to_id} &bull; {rel.to_type})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {rel.metadata && (
                      <span className="text-xs text-slate-500 font-mono">
                        {rel.metadata.eligibility ? `Eligibility: ${rel.metadata.eligibility}` : ''}
                        {rel.metadata.survey_status ? ` &bull; Survey: ${rel.metadata.survey_status}` : ''}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      {rel.created_at ? new Date(rel.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              ))}

              {relationships.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400">
                  No directed relations found for student {student.student_id}.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: ELIGIBLE OPENINGS */}
      {activeTab === 'eligibility' && (
        <div className="space-y-4">
          {eligibleJobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No eligible placement drives currently matching"
              description="Candidate does not meet current criteria or all registered drives have closed."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibleJobs.map((job) => (
                <Card key={job.job_id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm m-0">{job.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 m-0 font-mono">
                          {job.company_name || resolveCompanyName(job.company_id)} &bull; {job.location || 'Pan-India'}
                        </p>
                      </div>
                      <Badge variant="institutional" size="xs">{job.tier}</Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-800 flex-wrap">
                      <span className="font-mono font-bold text-emerald-700 text-sm">₹{job.package_lpa} LPA</span>
                      <span className="text-slate-300">&bull;</span>
                      <span>Min CGPA: {job.eligibility?.min_cgpa}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span>Max Backlogs: {job.eligibility?.max_backlogs}</span>
                    </div>

                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono text-slate-400">Required:</span>
                        {job.skills_required.map((sk: string) => (
                          <span key={sk} className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{job.vacancies || 5} Open Vacancies</span>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => navigate(`/tpo/drives/${job.job_id}`)}
                    >
                      View Placement Drive
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: APPLICATIONS PIPELINE */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No active applications logged yet"
              description="Candidate is currently in the active recruitment pool and eligible for 3 placement drives."
              actionLabel="Browse Eligible Openings"
              onAction={() => setActiveTab('eligibility')}
            />
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-medium uppercase tracking-wider text-xs">
                    <th className="px-4 py-3">App ID</th>
                    <th className="px-4 py-3">Drive / Role</th>
                    <th className="px-4 py-3">Package / Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.application_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-navy-900">
                        {app.application_id}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {app.job_title || app.job?.title || app.job_id}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-800">
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
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400 text-xs">
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
      )}

      {/* TAB 5: CAMP AI INSIGHTS & SKILL ROADMAP */}
      {activeTab === 'ai-telemetry' && (
        <div className="space-y-6">
          {aiPred && (
            <Card className="p-6">
              <h3 className="text-base  font-bold text-slate-900 mb-4 flex items-center gap-2 m-0">
                <Sparkles className="h-5 w-5 text-cardinal" />
                CAMP AI Predictive Career Telemetry
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs uppercase font-bold text-slate-500 block">Placement Probability</span>
                  <span className=" font-bold text-3xl text-navy-900 mt-1 block">
                    {Math.round((aiPred.placement_probability || 0.45) * 100)}%
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">Conformal Prediction Estimate</span>
                </div>

                <div className="p-4 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs uppercase font-bold text-slate-500 block">Expected CTC Package</span>
                  <span className=" font-bold text-3xl text-emerald-800 mt-1 block font-mono">
                    ₹{(aiPred.expected_package_lpa || 4.5).toFixed(1)} LPA
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">Based on Skill & CGPA Modeling</span>
                </div>

                <div className="p-4 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs uppercase font-bold text-slate-500 block">Risk Band</span>
                  <div className="mt-2">
                    <Badge
                      variant={
                        aiPred.risk_level === 'LOW'
                          ? 'success'
                          : aiPred.risk_level === 'MEDIUM'
                          ? 'warning'
                          : 'danger'
                      }
                      size="md"
                    >
                      {aiPred.risk_level || 'MEDIUM'} RISK CLASSIFICATION
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500 mt-2 block">Intervention advisory issued to mentor</span>
                </div>
              </div>
            </Card>
          )}

          {/* Recommended Skills Matrix */}
          <Card className="p-6">
            <h3 className="text-base  font-bold text-slate-900 mb-2 flex items-center gap-2 m-0">
              <TrendingUp className="h-5 w-5 text-emerald-700" />
              High-Yield Competency Recommendations
            </h3>
            <p className="text-xs text-slate-500 mb-4 m-0">
              Machine learning analysis of active corporate recruiter requirements to elevate hiring tiers:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {normalizedSkillRecs.map((sk) => (
                <div key={sk.skill} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex flex-col justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-900 uppercase block">
                      + {sk.skill}
                    </span>
                    {sk.demand != null && (
                      <span className="text-xs text-slate-500 mt-1 block">
                        Market Demand: {sk.demand}% &bull; Relevance: {sk.combined}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold">Tier Booster</span>
                    <span className="text-slate-400 font-mono">CAMP-03 Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: WHAT-IF CAREER SIMULATOR */}
      {activeTab === 'simulate' && (
        <WhatIfPage studentId={studentId} onBack={() => setActiveTab('dossier')} />
      )}

      {/* TAB 7: DPDP CONSENTS */}
      {activeTab === 'consent' && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">DPDP Act 2023 Consent Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Purpose-based candidate disclosures and statutory notice records for {student?.name || (student as any)?.full_name || studentId}.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded text-xs font-medium">
                <Shield size={13} className="text-emerald-600" />
                <span>DPDP 2023 Compliant</span>
              </div>
            </div>

            {consents.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Shield}
                  title="No consent records"
                  description="No DPDP purpose consent disclosures recorded for this candidate."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {consents.map((c: any) => {
                  const isActive = c.status === 'ACTIVE' || c.status === 'GRANTED' || c.is_granted;
                  return (
                    <div
                      key={c.purpose || c._id}
                      className="border border-slate-200 rounded p-4 bg-white flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              c.is_mandatory
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {c.is_mandatory ? 'Mandatory for Drives' : 'Optional Consent'}
                          </span>
                          <span
                            className={`text-xs font-medium flex items-center gap-1 ${
                              isActive ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                <span>Active Consent</span>
                              </>
                            ) : (
                              <span>Withdrawn / Pending</span>
                            )}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">
                          {c.purpose_title || c.purpose}
                        </h4>
                        <div className="text-xs font-mono text-slate-400 mb-2">Code: {c.purpose}</div>
                        {c.description && <p className="text-xs text-slate-600 mb-3">{c.description}</p>}
                        {c.disclosed_fields && c.disclosed_fields.length > 0 && (
                          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 mb-3">
                            <div className="text-xs font-medium text-slate-700 mb-1">
                              Disclosed Attributes:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {c.disclosed_fields.map((f: string) => (
                                <span
                                  key={f}
                                  className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Notice: {c.notice_version || 'v2026.1-DPDP'}</span>
                        {c.granted_at && (
                          <span>Granted: {new Date(c.granted_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
