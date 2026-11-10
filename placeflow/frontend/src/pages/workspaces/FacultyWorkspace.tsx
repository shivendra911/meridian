import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Award,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  Save,
  Send,
  GraduationCap,
  Building2,
  Briefcase,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { api } from '../../api';
import { FacultyProfile, Student } from '../../types';

interface FacultyWorkspaceProps {
  onNavigateTab?: (tabId: string) => void;
  onOpenCopilot?: () => void;
}

interface RosterStudent {
  id: string;
  name: string;
  roll: string;
  attendance: 'PRESENT' | 'ABSENT' | 'LATE';
  cieScore: number;
  grade: string;
  placementStatus?: string;
  surveyStatus?: string;
  companyEligibility?: string;
  verificationIssue?: string;
}

export const FacultyWorkspace: React.FC<FacultyWorkspaceProps> = ({
  onNavigateTab,
  onOpenCopilot,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'gradebook' | 'advising'>('roster');
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('FAC_0001');
  const [facultyDetail, setFacultyDetail] = useState<{
    faculty: FacultyProfile;
    roles?: string[];
    teaching?: {
      courses: string[];
      office_location: string;
      academic_rank: string;
      committees: string[];
    };
    appointments?: {
      hod?: any;
      hos?: any;
      admin?: any;
    };
    mentees: Student[];
    mentees_count: number;
    cohort_breakdown: any;
    action_items: {
      pending_submission: Student[];
      verification_blocked: Student[];
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('CS301');
  const [roster, setRoster] = useState<RosterStudent[]>([]);

  // 1. Load initial faculty roster
  useEffect(() => {
    api
      .getFacultyList({ limit: 50 })
      .then((res) => {
        if (res.faculty && res.faculty.length > 0) {
          setFacultyList(res.faculty);
          // Try to select one that has an interesting role if available
          const multiRole = res.faculty.find((f) => f.is_hod || f.is_placement_coordinator) || res.faculty[0];
          setSelectedFacultyId(multiRole.faculty_id);
        }
      })
      .catch((err) => {
        console.error('Failed to load faculty list:', err);
      });
  }, []);

  // 2. Load selected faculty detail and populate roster
  useEffect(() => {
    if (!selectedFacultyId) return;
    setLoading(true);

    api
      .getFacultyDetail(selectedFacultyId)
      .then((res) => {
        setFacultyDetail(res as any);
        const courses = res.teaching?.courses || res.faculty.courses_taught || ['CS301', 'CS401'];
        if (courses.length > 0) {
          setSelectedCourse(courses[0]);
        }

        // Initialize roster from mentees
        const menteesList = res.mentees || [];
        const initialRoster: RosterStudent[] = menteesList.map((m, idx) => {
          const rawCie = Math.min(50, Math.max(25, Math.round(m.cgpa * 5.2)));
          const letter =
            m.cgpa >= 9.0 ? 'O' : m.cgpa >= 8.0 ? 'A+' : m.cgpa >= 7.0 ? 'A' : m.cgpa >= 6.0 ? 'B+' : 'B';
          const attend = (m.attendance ?? 85) < 75 ? 'ABSENT' : idx % 7 === 0 ? 'LATE' : 'PRESENT';
          return {
            id: m.student_id,
            name: m.name,
            roll: m.student_id,
            attendance: attend,
            cieScore: rawCie,
            grade: letter,
            placementStatus: m.placement_status,
            surveyStatus: m.survey_status,
            companyEligibility: m.company_eligibility,
            verificationIssue: m.verification_issue,
          };
        });

        setRoster(initialRoster);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load faculty detail:', err);
        setLoading(false);
      });
  }, [selectedFacultyId]);

  const handleToggleAttendance = (id: string) => {
    setRoster(
      roster.map((s) => {
        if (s.id !== id) return s;
        const nextState =
          s.attendance === 'PRESENT' ? 'ABSENT' : s.attendance === 'ABSENT' ? 'LATE' : 'PRESENT';
        return { ...s, attendance: nextState };
      })
    );
  };

  const handleMarkAllPresent = () => {
    setRoster(roster.map((s) => ({ ...s, attendance: 'PRESENT' })));
  };

  const handleGradeChange = (id: string, newGrade: string) => {
    setRoster(roster.map((s) => (s.id === id ? { ...s, grade: newGrade } : s)));
  };

  const currentFaculty = facultyDetail?.faculty;
  const courses = facultyDetail?.teaching?.courses || currentFaculty?.courses_taught || ['CS301', 'CS401'];

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Faculty Status Ribbon with Profile Switcher */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs border-l-4 border-l-navy-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="neutral" size="xs">
              Faculty Teaching Workbench
            </Badge>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-mono text-slate-500">
              {currentFaculty?.faculty_id || 'FAC_0001'} &bull; {currentFaculty?.department || 'Computer Science'}
            </span>
            {currentFaculty?.is_hod && <Badge variant="warning" size="xs">Head of Department (HOD)</Badge>}
            {currentFaculty?.is_hos && <Badge variant="institutional" size="xs">School Dean (HOS)</Badge>}
            {currentFaculty?.is_placement_coordinator && (
              <Badge variant="info" size="xs">TPO Placement Coordinator</Badge>
            )}
            {currentFaculty?.is_admin && <Badge variant="danger" size="xs">Executive Administrator</Badge>}
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="font-serif font-bold text-xl text-slate-900 m-0">
              {currentFaculty?.name || 'Dr. Ramesh Kumar'}
            </h1>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1 focus:outline-navy-900"
            >
              {facultyList.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.name} ({f.academic_rank || f.designation} &bull; {f.department})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500 mt-0.5 m-0">
            {facultyDetail?.teaching?.academic_rank || currentFaculty?.academic_rank || currentFaculty?.designation || 'Associate Professor'} &bull; Office: {facultyDetail?.teaching?.office_location || currentFaculty?.office_location || 'Main Faculty Block'} &bull; Dean: {currentFaculty?.hos_name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCopilot}
            leftIcon={<Sparkles size={13} className="text-cardinal" />}
          >
            Teaching Assistant AI
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.success('Attendance & Grade records synchronized with CAMP-03 Academic Record Engine!')}
            leftIcon={<Save size={13} />}
          >
            Save Session Records
          </Button>
        </div>
      </div>

      {/* 2. Key Teaching Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Assigned Courses"
          value={String(courses.length)}
          subValue={courses.slice(0, 2).join(' & ')}
          change="8.0 Credits Total"
          changeType="neutral"
          icon={BookOpen}
        />
        <StatCard
          label="Total Assigned Mentees"
          value={String(facultyDetail?.mentees_count || roster.length)}
          subValue="Personal Advising Pod"
          change={`${facultyDetail?.cohort_breakdown?.survey_filled || 0} Survey Filled`}
          changeType="up"
          icon={Users}
        />
        <StatCard
          label="Assessment Shortlisted"
          value={String(facultyDetail?.cohort_breakdown?.eligible || 0)}
          subValue="Accenture 2026 Drive"
          change="Eligible for Assessment"
          changeType="up"
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending Advising Actions"
          value={String(
            (facultyDetail?.action_items?.pending_submission?.length || 0) +
              (facultyDetail?.action_items?.verification_blocked?.length || 0)
          )}
          subValue="Forms / Verification Blockers"
          change="Remedial Outreach Needed"
          changeType="down"
          icon={FileCheck2}
        />
      </div>

      {/* 3. Course Selector Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded p-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Active Delivery Course:
          </span>
          {courses.map((course) => (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
              className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                selectedCourse === course
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {course}: Instructional Section ({roster.length} Scholars)
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">Term: Spring Semester 2026</span>
      </div>

      {/* 4. Sub-Tabs */}
      <div className="space-y-4">
        <Tabs
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab as any)}
          tabs={[
            { id: 'roster', label: 'Class Roster & Attendance Matrix', icon: Users, count: roster.length },
            { id: 'gradebook', label: 'CIE Gradebook & Moderation', icon: Award },
            {
              id: 'advising',
              label: 'Mentee Advising & At-Risk Radar',
              icon: GraduationCap,
              count:
                (facultyDetail?.action_items?.pending_submission?.length || 0) +
                (facultyDetail?.action_items?.verification_blocked?.length || 0),
            },
          ]}
        />

        {/* SUBTAB 1: Roster & Attendance */}
        {activeSubTab === 'roster' && (
          <Card
            title={`Attendance Session: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
            subtitle="Click student status to toggle between Present, Absent, and Late"
            actionSlot={
              <Button variant="outline" size="xs" onClick={handleMarkAllPresent}>
                Mark All Present
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Eligibility</th>
                    <th className="py-2.5 px-3">CIE Progress</th>
                    <th className="py-2.5 px-3 text-center">Session Status</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{s.roll}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={s.companyEligibility === 'Eligible for Assesment' ? 'success' : 'neutral'}
                          size="xs"
                        >
                          {s.companyEligibility || 'Under Review'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{s.cieScore} / 50</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleAttendance(s.id)}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border cursor-pointer transition-colors ${
                            s.attendance === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : s.attendance === 'ABSENT'
                              ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {s.attendance}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onNavigateTab?.('students')}
                          className="text-[11px] font-semibold text-cardinal hover:underline"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* SUBTAB 2: Gradebook */}
        {activeSubTab === 'gradebook' && (
          <Card
            title="Continuous Internal Evaluation (CIE) Gradebook"
            subtitle="UGC 10-Point Scale Letter Grade Assignment"
            actionSlot={
              <Button
                variant="primary"
                size="xs"
                rightIcon={<Send size={11} />}
                onClick={() => toast.success('CIE Grade proposal submitted to Dean of Academics for Moderation!')}
              >
                Submit for Moderation
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3 font-mono">Roll</th>
                    <th className="py-2.5 px-3">Raw CIE (50)</th>
                    <th className="py-2.5 px-3">Letter Grade</th>
                    <th className="py-2.5 px-3">Grade Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {roster.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{s.roll}</td>
                      <td className="py-2.5 px-3">{s.cieScore}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={s.grade}
                          onChange={(e) => handleGradeChange(s.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800 focus:border-cardinal"
                        >
                          {['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-bold">
                        {s.grade === 'O' ? '10.0' : s.grade === 'A+' ? '9.0' : s.grade === 'A' ? '8.0' : s.grade === 'B+' ? '7.0' : s.grade === 'B' ? '6.0' : s.grade === 'C' ? '5.0' : s.grade === 'P' ? '4.0' : '0.0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* SUBTAB 3: Mentee Advising */}
        {activeSubTab === 'advising' && (
          <div className="space-y-4">
            <Card title="At-Risk Mentees & Action Items Radar" subtitle="Accenture Campus Recruitment 2026 Telemetry">
              <div className="space-y-3 text-xs">
                {facultyDetail?.action_items?.pending_submission &&
                  facultyDetail.action_items.pending_submission.map((stu) => (
                    <div
                      key={stu.student_id}
                      className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-start justify-between"
                    >
                      <div>
                        <div className="font-bold">
                          {stu.name} ({stu.student_id}) &bull; CGPA: {stu.cgpa}
                        </div>
                        <p className="mt-0.5 text-amber-800 m-0">
                          Accenture Recruitment Survey Form pending submission. Mentee outreach required.
                        </p>
                      </div>
                      <Badge variant="warning" size="xs">Form Pending</Badge>
                    </div>
                  ))}

                {facultyDetail?.action_items?.verification_blocked &&
                  facultyDetail.action_items.verification_blocked.map((stu) => (
                    <div
                      key={stu.student_id}
                      className="p-3 bg-red-50 border border-red-200 rounded text-red-900 flex items-start justify-between"
                    >
                      <div>
                        <div className="font-bold">
                          {stu.name} ({stu.student_id}) &bull; CGPA: {stu.cgpa}
                        </div>
                        <p className="mt-0.5 text-red-800 m-0">
                          Verification blocker flagged: {stu.verification_issue || 'Identity document mismatch'}.
                        </p>
                      </div>
                      <Badge variant="danger" size="xs">Verification Blocked</Badge>
                    </div>
                  ))}

                {(!facultyDetail?.action_items?.pending_submission?.length &&
                  !facultyDetail?.action_items?.verification_blocked?.length) && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-center">
                    <CheckCircle2 size={18} className="mx-auto mb-1 text-emerald-700" />
                    <div className="font-bold">All Mentees Up to Date!</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      No pending survey submissions or identity verification blockers flagged for this mentor pod.
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
