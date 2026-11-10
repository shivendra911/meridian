import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { api } from '../../api';
import { HodProfile, FacultyProfile } from '../../types';

interface HodWorkspaceProps {
  onNavigateTab?: (tabId: string) => void;
  onOpenCopilot?: () => void;
}

export const HodWorkspace: React.FC<HodWorkspaceProps> = ({
  onNavigateTab,
  onOpenCopilot,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'workload' | 'standing'>('approvals');
  const [hodList, setHodList] = useState<HodProfile[]>([]);
  const [selectedHodId, setSelectedHodId] = useState<string>('');
  const [deptFaculty, setDeptFaculty] = useState<FacultyProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Load Department Heads
  useEffect(() => {
    api
      .getDepartmentHeads()
      .then((res) => {
        if (res.department_heads && res.department_heads.length > 0) {
          setHodList(res.department_heads);
          setSelectedHodId(res.department_heads[0].hod_id);
        }
      })
      .catch((err) => {
        console.error('Failed to load department heads:', err);
      });
  }, []);

  // 2. Load departmental faculty when selected HOD changes
  useEffect(() => {
    if (!selectedHodId) return;
    setLoading(true);

    const currentHod = hodList.find((h) => h.hod_id === selectedHodId);
    api
      .getFacultyList({
        hod_id: selectedHodId,
        limit: 50,
      })
      .then((res) => {
        setDeptFaculty(res.faculty || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load departmental faculty:', err);
        setLoading(false);
      });
  }, [selectedHodId, hodList]);

  const currentHod = hodList.find((h) => h.hod_id === selectedHodId) || hodList[0];

  return (
    <div className="space-y-6 font-sans">
      {/* 1. HOD Status Ribbon with Department Switcher */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs border-l-4 border-l-navy-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="neutral" size="xs">
              Departmental Governance &bull; HOD Command
            </Badge>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-mono text-slate-500">
              {currentHod?.school || 'University Campus'} &bull; Dept: {currentHod?.department || 'Computer Science'}
            </span>
            <Badge variant="warning" size="xs">Dual Role: Active Teacher & HOD</Badge>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="font-serif font-bold text-xl text-slate-900 m-0">
              {currentHod?.name || 'Prof. Dr. Department Head'}
            </h1>
            <select
              value={selectedHodId}
              onChange={(e) => setSelectedHodId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1 focus:outline-navy-900 font-mono"
            >
              {hodList.map((h) => (
                <option key={h.hod_id} value={h.hod_id}>
                  {h.department} &bull; {h.name} ({h.hod_id})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500 mt-0.5 m-0 font-mono">
            Reporting Dean: {currentHod?.hos_name || 'Executive Dean'} &bull; Jurisdiction: {currentHod?.faculty_count || deptFaculty.length} Faculty Members &bull; {currentHod?.students_count || 0} Candidates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCopilot}
            leftIcon={<Sparkles size={13} className="text-cardinal" />}
          >
            Department Intelligence AI
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateTab?.('academic')}
            rightIcon={<ArrowRight size={13} />}
          >
            Curriculum Designer
          </Button>
        </div>
      </div>

      {/* 2. Key Department Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Department Enrollment"
          value={String(currentHod?.students_count || 0)}
          subValue="Active Candidates"
          change={`${currentHod?.faculty_count || deptFaculty.length} Assigned Faculty`}
          changeType="neutral"
          icon={Users}
        />
        <StatCard
          label="Assessment Shortlisted"
          value={String(currentHod?.assessment_eligible_count || 0)}
          subValue="Accenture 2026 Drive"
          change="Qualified for Assessment"
          changeType="up"
          icon={CheckCircle2}
        />
        <StatCard
          label="Survey Form Completion"
          value={`${currentHod?.completion_rate || 0}%`}
          subValue={`${currentHod?.form_filled_count || 0} / ${currentHod?.students_count || 0} Filled`}
          change={`${currentHod?.form_pending_count || 0} Pending Response`}
          changeType="up"
          icon={FileCheck2}
        />
        <StatCard
          label="Already Placed"
          value={String(currentHod?.placed_count || 0)}
          subValue="Prior Corporate Offers"
          change="Off-Campus & PPOs"
          changeType="neutral"
          icon={GraduationCap}
        />
      </div>

      {/* 3. Sub-Tabs */}
      <div className="space-y-4">
        <Tabs
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab as any)}
          tabs={[
            { id: 'approvals', label: 'Curriculum & Role Delegations', icon: FileCheck2, count: 2 },
            { id: 'workload', label: 'Faculty Teaching Roster & Workload', icon: Users, count: deptFaculty.length },
            { id: 'standing', label: 'Candidate Readiness & Telemetry Audit', icon: BarChart3 },
          ]}
        />

        {activeSubTab === 'approvals' && (
          <Card title="Pending Departmental Approvals Queue" subtitle="Curriculum versions, course introductions & role assignments">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{currentHod?.department} Curriculum Revision (v2026.1)</span>
                    <Badge variant="warning" size="xs">Pending Approval</Badge>
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    +2 Elective Tracks (AI Systems, Cloud Infrastructure) &bull; Credit Balance: 160.0 Credits
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="xs" onClick={() => onNavigateTab?.('academic')}>
                    Inspect Diff
                  </Button>
                  <Button variant="primary" size="xs" onClick={() => toast.success(`Approved curriculum revision for ${currentHod?.department}!`)}>
                    Approve Version
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Department Placement Liaison Delegation</span>
                    <Badge variant="info" size="xs">TPO Delegation</Badge>
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    Delegate: Faculty Placement Coordinator &bull; Scope: {currentHod?.department} &bull; Term: 1 Year
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="xs" onClick={() => toast.success('Department Placement Liaison Scope Confirmed!')}>
                    Confirm Scope
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeSubTab === 'workload' && (
          <Card
            title={`Department Faculty Roster (${deptFaculty.length} Teachers)`}
            subtitle="Multi-role faculty appointments, instructional delivery, and student mentoring pods"
          >
            <div className="divide-y divide-slate-100 text-xs">
              {deptFaculty.map((fac) => (
                <div key={fac.faculty_id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{fac.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">UID: {fac.faculty_id}</span>
                      {fac.is_hod && <Badge variant="warning" size="xs">HOD</Badge>}
                      {fac.is_placement_coordinator && <Badge variant="info" size="xs">Placement Coordinator</Badge>}
                      <Badge variant="neutral" size="xs">{fac.academic_rank || fac.designation}</Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-mono">
                      Courses: {fac.courses_taught?.join(', ') || 'Instruction Courses'} &bull; Office: {fac.office_location || 'Faculty Block'} &bull; Mentees: {fac.mentees_count} Students
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={fac.action_items_count > 0 ? 'warning' : 'success'} size="xs">
                      {fac.action_items_count > 0 ? `${fac.action_items_count} Actions` : 'All Updated'}
                    </Badge>
                    <span className="font-mono text-slate-700 font-semibold">{fac.completion_rate}% Survey Filled</span>
                  </div>
                </div>
              ))}

              {deptFaculty.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Loading faculty roster for {currentHod?.department}...
                </div>
              )}
            </div>
          </Card>
        )}

        {activeSubTab === 'standing' && (
          <Card title="Student Progression & Readiness Standing" subtitle="Accenture Campus Recruitment 2026 Cohort Telemetry">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
                <div className="text-[10px] text-emerald-700 font-bold uppercase font-mono">Eligible for Assessment</div>
                <div className="font-serif font-bold text-2xl text-emerald-900 mt-1">
                  {currentHod?.assessment_eligible_count || 0}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  {currentHod?.students_count
                    ? Math.round(((currentHod.assessment_eligible_count || 0) / currentHod.students_count) * 100)
                    : 0}
                  % of Department Cohort
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="text-[10px] text-blue-700 font-bold uppercase font-mono">Survey Completed</div>
                <div className="font-serif font-bold text-2xl text-blue-900 mt-1">
                  {currentHod?.form_filled_count || 0}
                </div>
                <div className="text-[10px] text-blue-600 mt-0.5">{currentHod?.completion_rate || 0}% Compliance Rate</div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                <div className="text-[10px] text-amber-700 font-bold uppercase font-mono">Pending Responses</div>
                <div className="font-serif font-bold text-2xl text-amber-900 mt-1">
                  {currentHod?.form_pending_count || 0}
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">Assigned to Department Mentors</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
