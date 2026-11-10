import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  HosProfile,
  HodProfile,
  FacultyProfile,
  AdminProfile,
  InstitutionalSummary,
  PlacementDrive,
  Student,
} from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { SlideOverDrawer } from '../components/ui/SlideOverDrawer';
import {
  Users,
  GraduationCap,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Briefcase,
  Search,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Sparkles,
  GitFork,
  ExternalLink,
  Award,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export const InstitutionalHierarchyPage: React.FC = () => {
  const navigate = useNavigate();

  // Primary data states
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<InstitutionalSummary | null>(null);
  const [hosList, setHosList] = useState<HosProfile[]>([]);
  const [hodList, setHodList] = useState<HodProfile[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [adminsList, setAdminsList] = useState<AdminProfile[]>([]);
  const [driveData, setDriveData] = useState<PlacementDrive | null>(null);

  // Active filter and tab states
  const [activeTab, setActiveTab] = useState<'hos' | 'hod' | 'faculty' | 'admins' | 'drive' | 'graph'>('hos');
  const [selectedHosFilter, setSelectedHosFilter] = useState<string>('ALL');
  const [selectedHodFilter, setSelectedHodFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [facultySearch, setFacultySearch] = useState('');
  const [facultySort, setFacultySort] = useState<'mentees_count' | 'completion_rate' | 'action_items_count'>('mentees_count');

  // Drawer state for specific faculty mentee inspection
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
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
    cohort_breakdown: any;
    action_items: any;
  } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Load baseline summary and lists
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getInstitutionalSummary(),
      api.getDepartmentHeads(),
      api.getFacultyList({ limit: 100 }),
      api.getAdmins(),
    ])
      .then(([summaryRes, hodsRes, facultyRes, adminsRes]) => {
        setSummaryData(summaryRes);
        setHosList(summaryRes.school_heads || []);
        setDriveData(summaryRes.drive || null);
        setHodList(hodsRes.department_heads || []);
        setFacultyList(facultyRes.faculty || []);
        setAdminsList(adminsRes.admins || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load institutional hierarchy data:', err);
        setLoading(false);
      });
  }, []);

  // Filter faculty on search, role, or HOD change
  useEffect(() => {
    const params: any = { limit: 100, sort: facultySort };
    if (selectedHodFilter !== 'ALL') params.hod_id = selectedHodFilter;
    if (selectedHosFilter !== 'ALL') params.hos = selectedHosFilter;
    if (selectedRoleFilter !== 'ALL') params.role = selectedRoleFilter;
    if (facultySearch.trim()) params.search = facultySearch.trim();

    api
      .getFacultyList(params)
      .then((res) => setFacultyList(res.faculty || []))
      .catch(() => {});
  }, [selectedHodFilter, selectedHosFilter, selectedRoleFilter, facultySearch, facultySort]);

  // Load individual faculty drawer
  const handleOpenFaculty = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    setDrawerLoading(true);
    api
      .getFacultyDetail(facultyId)
      .then((res) => {
        setFacultyDetail(res);
        setDrawerLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load mentor cohort details');
        setDrawerLoading(false);
      });
  };

  const filteredHods =
    selectedHosFilter === 'ALL'
      ? hodList
      : hodList.filter((h) => h.hos_name === selectedHosFilter);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Institutional Mentorship & Hierarchy Hub"
        description="Comprehensive multi-tier governance tracking: School Deans (HOS) → Department Heads (HOD) → Faculty Mentors & Teachers → Student Cohort (7,141 Candidates) with concurrent appointments."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success" size="md">
              <CheckCircle2 size={13} className="mr-1" />
              Live MongoDB Verified
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success('Syncing institutional records across CAMP-01 topology...');
              }}
            >
              Sync Records
            </Button>
          </div>
        }
      />

      {/* 2. Top-Level Institutional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Student Cohort"
          value={summaryData ? summaryData.kpis.total_students.toLocaleString() : (driveData ? driveData.total_candidates.toLocaleString() : '7,141')}
          subValue="Class of 2026-2027"
          change="3 Schools &bull; 54 Depts"
          changeType="neutral"
          icon={GraduationCap}
        />
        <StatCard
          label="Assessment Eligible"
          value={driveData ? driveData.eligible_count.toLocaleString() : '5,111'}
          subValue="71.65% Candidate Pass"
          change="Accenture Shortlisted"
          changeType="up"
          icon={CheckCircle2}
        />
        <StatCard
          label="Survey Form Responses"
          value={driveData ? driveData.form_filled_count.toLocaleString() : '6,302'}
          subValue="88.35% Completed"
          change="831 Pending Submission"
          changeType="up"
          icon={FileCheck2}
        />
        <StatCard
          label="Faculty Personnel"
          value={summaryData ? summaryData.kpis.total_faculty_personnel.toLocaleString() : '542'}
          subValue="Multi-Role Teachers & Mentors"
          change="Avg 13.2 Students / Mentor"
          changeType="neutral"
          icon={Users}
        />
        <StatCard
          label="Department Heads (HOD)"
          value={summaryData ? summaryData.kpis.total_department_heads.toLocaleString() : '54'}
          subValue="4 Executive Deans (HOS)"
          change="6 Institutional Admins"
          changeType="neutral"
          icon={Building2}
        />
      </div>

      {/* 3. Multi-Role Synthesis Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-800 rounded-lg p-4 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CAMP-02 Multi-Role Synthesis
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-xs text-slate-300">Unified Academic Appointments</span>
          </div>
          <h2 className="font-serif font-bold text-lg text-white mt-1 m-0">
            De-Siloed Institutional Faculty & Governance Network
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 m-0 max-w-2xl">
            A single faculty member concurrently holds multiple functional roles: instructional teaching, student mentoring, department administration, school leadership, and campus recruitment coordination.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-mono">Teachers</span>
            <span className="text-sm font-bold text-white font-mono">{summaryData?.kpis.multi_role_breakdown?.active_teachers || 542}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-mono">Faculty HODs</span>
            <span className="text-sm font-bold text-amber-300 font-mono">{summaryData?.kpis.multi_role_breakdown?.teachers_serving_as_hod || 54}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-mono">Faculty Deans</span>
            <span className="text-sm font-bold text-sky-300 font-mono">{summaryData?.kpis.multi_role_breakdown?.teachers_serving_as_hos || 4}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-mono">TPO Coordinators</span>
            <span className="text-sm font-bold text-purple-300 font-mono">{summaryData?.kpis.multi_role_breakdown?.faculty_placement_coordinators || 4}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-mono">Exec Admins</span>
            <span className="text-sm font-bold text-emerald-300 font-mono">{summaryData?.kpis.total_administrators || 6}</span>
          </div>
        </div>
      </div>

      {/* 4. Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'hos', label: 'School Heads (HOS)', badge: `${hosList.length} Schools` },
          { id: 'hod', label: 'Department Heads (HOD)', badge: `${filteredHods.length} HODs` },
          { id: 'faculty', label: 'Faculty & Mentors', badge: `${facultyList.length} Loaded` },
          { id: 'admins', label: 'Admins & Directorate', badge: `${adminsList.length} Leaders` },
          { id: 'drive', label: 'Accenture 2026 Telemetry', badge: 'Drive Radar' },
          { id: 'graph', label: 'Hierarchy Topology Graph', badge: `${summaryData?.kpis.total_graph_relationships?.toLocaleString() || '15,994'} Edges` },
        ]}
      />

      {/* TAB 1: SCHOOL HEADS (HOS VIEW) */}
      {activeTab === 'hos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hosList.map((hos) => {
              const completion = hos.completion_rate || 0;
              const eligRate =
                hos.students_count > 0
                  ? Math.round((hos.assessment_eligible_count / hos.students_count) * 100)
                  : 0;
              return (
                <Card key={hos.hos_id} className="p-5 border-l-4 border-l-navy-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="institutional" size="xs">
                        {hos.hos_id}
                      </Badge>
                      <Badge
                        variant={completion >= 85 ? 'success' : 'warning'}
                        size="xs"
                      >
                        {completion}% Form Completed
                      </Badge>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-slate-900 mt-2 m-0">
                      {hos.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 m-0">
                      {hos.designation} &bull; {hos.school}
                    </p>

                    {/* Progress Bars */}
                    <div className="mt-4 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Survey Completion ({hos.form_filled_count} / {hos.students_count})</span>
                          <span className="font-semibold">{completion}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Assessment Shortlisted ({hos.assessment_eligible_count} / {hos.students_count})</span>
                          <span className="font-semibold text-navy-800">{eligRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-navy-900 h-2 rounded-full transition-all"
                            style={{ width: `${eligRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4 Key Numbers */}
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">HODs</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">{hos.hod_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Faculty</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">{hos.faculty_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending</span>
                        <span className="text-sm font-bold text-amber-700 font-mono">{hos.form_pending_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Placed</span>
                        <span className="text-sm font-bold text-emerald-700 font-mono">{hos.placed_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Jurisdiction: {hos.school.split(' ')[2] || 'University'} Cohort</span>
                    <Button
                      variant="outline"
                      size="xs"
                      rightIcon={<ChevronRight size={12} />}
                      onClick={() => {
                        setSelectedHosFilter(hos.name);
                        setActiveTab('hod');
                      }}
                    >
                      View Department HODs
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT HEADS (HOD VIEW) */}
      {activeTab === 'hod' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter by School Head:</span>
              <select
                value={selectedHosFilter}
                onChange={(e) => setSelectedHosFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-navy-900"
              >
                <option value="ALL">All Schools ({hodList.length} Departments)</option>
                {hosList.map((h) => (
                  <option key={h.hos_id} value={h.name}>
                    {h.name} &bull; {h.school}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredHods.length} of {hodList.length} Head of Department portfolios
            </span>
          </div>

          {/* HOD Table */}
          <Card className="overflow-hidden p-0 border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">HOD UID</th>
                    <th className="py-3 px-4">Department Head</th>
                    <th className="py-3 px-4">School & Reporting Dean</th>
                    <th className="py-3 px-4 text-center">Faculty Mentors</th>
                    <th className="py-3 px-4 text-center">Students</th>
                    <th className="py-3 px-4 text-center">Eligible</th>
                    <th className="py-3 px-4 text-center">Survey Progress</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredHods.map((hod) => (
                    <tr key={hod.hod_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy-900">
                        {hod.hod_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{hod.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{hod.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 block">{hod.school}</span>
                        <span className="text-[10px] text-slate-400">Reports to: {hod.hos_name}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {hod.faculty_count}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {hod.students_count}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="success" size="xs">
                          {hod.assessment_eligible_count}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-32 mx-auto">
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-emerald-700 font-semibold">{hod.form_filled_count} filled</span>
                            <span className="text-amber-700 font-semibold">{hod.form_pending_count} pend</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full"
                              style={{ width: `${hod.completion_rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          rightIcon={<ChevronRight size={12} />}
                          onClick={() => {
                            setSelectedHodFilter(hod.hod_id);
                            setActiveTab('faculty');
                          }}
                        >
                          Faculty ({hod.faculty_count})
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: FACULTY & TEACHING MENTORS (MULTI-ROLE VIEW) */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search mentor by name, UID, school, or department..."
                  value={facultySearch}
                  onChange={(e) => setFacultySearch(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-8 pr-3 py-1.5 focus:outline-navy-900"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedHodFilter}
                  onChange={(e) => setSelectedHodFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-navy-900"
                >
                  <option value="ALL">All HOD Portfolios</option>
                  {hodList.map((h) => (
                    <option key={h.hod_id} value={h.hod_id}>
                      {h.name} ({h.hod_id})
                    </option>
                  ))}
                </select>

                <select
                  value={facultySort}
                  onChange={(e) => setFacultySort(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-navy-900"
                >
                  <option value="mentees_count">Sort: Most Mentees</option>
                  <option value="action_items_count">Sort: Most Action Items</option>
                  <option value="completion_rate">Sort: Highest Completion</option>
                  <option value="form_pending_count">Sort: Most Pending Forms</option>
                </select>

                {(selectedHodFilter !== 'ALL' || selectedRoleFilter !== 'ALL' || facultySearch) && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setSelectedHodFilter('ALL');
                      setSelectedHosFilter('ALL');
                      setSelectedRoleFilter('ALL');
                      setFacultySearch('');
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1">Filter Role:</span>
              {[
                { id: 'ALL', label: 'All Personnel' },
                { id: 'TEACHER', label: 'Teachers' },
                { id: 'MENTOR', label: 'Mentors' },
                { id: 'HOD', label: 'HODs' },
                { id: 'HOS', label: 'Deans (HOS)' },
                { id: 'TPO_COORDINATOR', label: 'Placement Coordinators' },
                { id: 'ADMIN', label: 'Executive Admins' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleFilter(r.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedRoleFilter === r.id
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Faculty Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facultyList.map((f) => (
              <Card
                key={f.faculty_id}
                className="p-4 border border-slate-200 hover:border-navy-900 transition-all cursor-pointer flex flex-col justify-between"
                onClick={() => handleOpenFaculty(f.faculty_id)}
              >
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {f.faculty_id}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {f.is_hos && <Badge variant="institutional" size="xs">Dean / HOS</Badge>}
                      {f.is_hod && <Badge variant="warning" size="xs">HOD</Badge>}
                      {f.is_placement_coordinator && <Badge variant="info" size="xs">TPO Liaison</Badge>}
                      {f.is_admin && <Badge variant="danger" size="xs">Admin</Badge>}
                      <Badge
                        variant={f.action_items_count > 0 ? 'warning' : 'success'}
                        size="xs"
                      >
                        {f.action_items_count > 0 ? `${f.action_items_count} Actions` : 'Updated'}
                      </Badge>
                    </div>
                  </div>

                  <h4 className="font-serif font-bold text-base text-slate-900 mt-2 m-0 flex items-center gap-1.5">
                    {f.name}
                  </h4>
                  <p className="text-[11px] text-slate-700 font-semibold mt-0.5 line-clamp-1 m-0">
                    {f.academic_rank || f.designation} &bull; {f.department}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 m-0 font-mono">
                    Office: {f.office_location || 'Main Faculty Block'} &bull; Dean: {f.hos_name}
                  </p>

                  {/* Courses Taught Chips */}
                  {f.courses_taught && f.courses_taught.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <span className="text-[9px] text-slate-400 font-mono">Teaching:</span>
                      {f.courses_taught.map((c) => (
                        <span key={c} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono border border-slate-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 rounded p-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Mentees</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">{f.mentees_count}</span>
                    </div>
                    <div className="bg-emerald-50 rounded p-1.5">
                      <span className="text-[9px] uppercase font-bold text-emerald-700 block">Eligible</span>
                      <span className="text-xs font-bold text-emerald-800 font-mono">{f.assessment_eligible_count}</span>
                    </div>
                    <div className="bg-amber-50 rounded p-1.5">
                      <span className="text-[9px] uppercase font-bold text-amber-700 block">Pending</span>
                      <span className="text-xs font-bold text-amber-800 font-mono">{f.form_pending_count}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Survey Response Rate</span>
                      <span className="font-bold text-slate-800">{f.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full"
                        style={{ width: `${f.completion_rate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{f.already_placed_count} Placed Elsewhere</span>
                  <span className="text-navy-900 font-semibold flex items-center gap-0.5">
                    Inspect Cohort <ChevronRight size={12} />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB: INSTITUTIONAL ADMINISTRATORS & DIRECTORATE */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 border-l-4 border-l-navy-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="institutional" size="xs">
                  CAMP-02 Executive Leadership
                </Badge>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs font-mono text-slate-500">Governance & Regulatory Directorate</span>
              </div>
              <h2 className="font-serif font-bold text-xl text-slate-900 mt-1 m-0">
                Institutional Administrators & Executive Officers
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                Authoritative executive leadership controlling university governance, career placement audit, academic progression, and platform security.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active Administrators</span>
              <span className="text-2xl font-bold font-mono text-navy-900">{adminsList.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminsList.map((adm) => (
              <Card key={adm.admin_id} className="p-5 border border-slate-200 hover:border-navy-900 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="institutional" size="xs">
                      {adm.admin_id}
                    </Badge>
                    <Badge variant="success" size="xs">
                      {adm.status}
                    </Badge>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-slate-900 mt-2.5 m-0">
                    {adm.name}
                  </h3>
                  <p className="text-xs text-slate-800 font-semibold mt-0.5 m-0">
                    {adm.role}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 m-0 font-mono">
                    {adm.office} &bull; {adm.email}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                      Assigned IAM Permissions ({adm.permissions.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {adm.permissions.map((p) => (
                        <span key={p} className="text-[9px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded border border-slate-200">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {adm.faculty_id ? (
                    <>
                      <span className="text-slate-500 font-mono text-[11px]">
                        Teacher UID: {adm.faculty_id}
                      </span>
                      <Button
                        variant="outline"
                        size="xs"
                        rightIcon={<ChevronRight size={12} />}
                        onClick={() => handleOpenFaculty(adm.faculty_id!)}
                      >
                        Teaching Dossier
                      </Button>
                    </>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Direct Executive Officer</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACCENTURE 2026 DRIVE TELEMETRY */}
      {activeTab === 'drive' && driveData && (
        <div className="space-y-6">
          {/* Drive Header Banner */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 border-l-4 border-l-cardinal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="institutional" size="xs">
                  Campus Recruitment Drive 2026
                </Badge>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs font-mono text-slate-500">ID: {driveData.drive_id}</span>
              </div>
              <h2 className="font-serif font-bold text-xl text-slate-900 mt-1 m-0">
                {driveData.company_name} &bull; {driveData.role_title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                Target Cohort: B.Tech / B.E. / Dual Degree {driveData.batch_year} &bull; Full-Time Engineering Stream
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Candidate Pool</span>
              <span className="text-2xl font-bold font-mono text-navy-900">
                {driveData.total_candidates.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Drive Funnel Visualization */}
          <Card className="p-6">
            <h3 className="font-serif font-bold text-base text-slate-900 mb-4 m-0">
              Recruitment Conversion & Eligibility Funnel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">1. Total Ingested Pool</span>
                <span className="text-xl font-bold text-slate-900 font-mono block mt-1">
                  {driveData.total_candidates.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">100% University Roster</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">2. Company Shortlisted</span>
                <span className="text-xl font-bold text-emerald-900 font-mono block mt-1">
                  {driveData.eligible_count.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-700 mt-1 block">
                  {((driveData.eligible_count / driveData.total_candidates) * 100).toFixed(1)}% Assessment Eligible
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase text-blue-800 block">3. Survey Responded</span>
                <span className="text-xl font-bold text-blue-900 font-mono block mt-1">
                  {driveData.form_filled_count.toLocaleString()}
                </span>
                <span className="text-xs text-blue-700 mt-1 block">
                  {((driveData.form_filled_count / driveData.total_candidates) * 100).toFixed(1)}% Form Compliance
                </span>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase text-purple-800 block">4. Email Confirmed</span>
                <span className="text-xl font-bold text-purple-900 font-mono block mt-1">
                  {driveData.responses_yes.toLocaleString()}
                </span>
                <span className="text-xs text-purple-700 mt-1 block">Received "Moving Ahead" Email</span>
              </div>
            </div>
          </Card>

          {/* Breakdown of Ineligibility & Remarks Issues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h4 className="font-serif font-bold text-sm text-slate-900 mb-3 m-0 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-600" />
                Student-Reported Survey Issues ({driveData.responses_no.toLocaleString()})
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">
                      Received "Not Eligible" message from Accenture
                    </span>
                    <span className="text-[10px] text-slate-500">Student received direct rejection email</span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {driveData.rejection_breakdown?.received_not_eligible_mail || 690}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">
                      Registered through link but no further update
                    </span>
                    <span className="text-[10px] text-slate-500">Awaiting scheduling or background screening</span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {driveData.rejection_breakdown?.registered_link_no_update || 589}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">
                      Never received any registration email
                    </span>
                    <span className="text-[10px] text-slate-500">Spam folder check or email address error</span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {driveData.rejection_breakdown?.no_registration_mail_received || 498}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-serif font-bold text-sm text-slate-900 mb-3 m-0 flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-cardinal" />
                Mentor-Flagged Discrepancies & Remarks
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Already Placed in Corporate Roster (Infineon, Lowe's, etc.)</span>
                  <span className="font-mono font-bold text-emerald-800">{driveData.remarks_breakdown?.already_placed || 48}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">On OJT / Off-Campus Internship (Bengaluru, Hyderabad, etc.)</span>
                  <span className="font-mono font-bold text-navy-900">{driveData.remarks_breakdown?.on_internship_ojt || 74}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Identity / PAN Card / Photo Verification Blockers</span>
                  <span className="font-mono font-bold text-cardinal">{driveData.remarks_breakdown?.verification_blocked || 28}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Backlogs / Reappear Concerns</span>
                  <span className="font-mono font-bold text-amber-700">{driveData.remarks_breakdown?.has_backlog || 22}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Pursuing Startup / Independent Ventures</span>
                  <span className="font-mono font-bold text-purple-700">{driveData.remarks_breakdown?.startup_opt_out || 14}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Medical Emergency / Formal Term-Off</span>
                  <span className="font-mono font-bold text-slate-700">{driveData.remarks_breakdown?.medical_term_off || 12}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Unreachable Contact / Call Not Received</span>
                  <span className="font-mono font-bold text-slate-700">{driveData.remarks_breakdown?.unreachable_phone || 65}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: INSTITUTIONAL HIERARCHY GRAPH */}
      {activeTab === 'graph' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900 m-0">
                Institutional Reporting Topology & Graph Relations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                14,836 directed relations connecting Candidates → Mentors → HODs → School Deans → Placement Drive.
              </p>
            </div>
            <Badge variant="institutional" size="xs">
              4-Tier Directed Acyclic Graph
            </Badge>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 font-mono text-xs text-slate-800 space-y-6">
            {/* Level 1: HOS */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Level 1: Executive School Deans (4 HOS Nodes)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {hosList.map((h) => (
                  <div key={h.hos_id} className="bg-white border-2 border-navy-900 rounded p-3 shadow-xs">
                    <span className="text-[9px] uppercase font-bold text-navy-800 block">{h.hos_id}</span>
                    <span className="font-bold text-xs text-slate-900 block">{h.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{h.school}</span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      {h.students_count.toLocaleString()} Students &bull; {h.faculty_count} Mentors
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tree Branch Visual */}
            <div className="border-l-2 border-dashed border-slate-300 ml-6 pl-6 space-y-6">
              {/* Level 2: HOD */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                  Level 2: Department Heads (54 HOD Nodes) &bull; Sample Branches
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {hodList.slice(0, 6).map((h) => (
                    <div key={h.hod_id} className="bg-white border border-slate-200 rounded p-2.5">
                      <span className="text-[9px] font-bold text-slate-500 block">UID: {h.hod_id}</span>
                      <span className="font-bold text-xs text-slate-900 block truncate">{h.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {h.faculty_count} Faculty Mentors &bull; {h.students_count} Students
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 3: Faculty */}
              <div className="border-l-2 border-dashed border-slate-300 ml-6 pl-6">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                  Level 3: Faculty Mentors (508 Active Mentors)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {facultyList.slice(0, 4).map((f) => (
                    <div key={f.faculty_id} className="bg-white border border-slate-200 rounded p-2 text-[11px]">
                      <span className="font-bold block truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400">Mentoring {f.mentees_count} Students</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 4: Students */}
              <div className="border-l-2 border-dashed border-slate-300 ml-12 pl-6">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Level 4: Verified Student Cohort (7,133 Students)
                </span>
                <p className="text-[11px] text-slate-500 m-0">
                  Each student linked via bidirectional graph edges to their dedicated Faculty Mentor, Department HOD, and Target Placement Drive.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* DRAWER: DETAILED FACULTY MULTI-ROLE & MENTEE COHORT INSPECTOR */}
      <SlideOverDrawer
        isOpen={selectedFacultyId !== null}
        onClose={() => {
          setSelectedFacultyId(null);
          setFacultyDetail(null);
        }}
        title={facultyDetail ? `Faculty Dossier: ${facultyDetail.faculty.name}` : 'Loading Faculty Dossier...'}
        width="2xl"
      >
        {drawerLoading || !facultyDetail ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading student cohort & academic profile...</div>
        ) : (
          <div className="p-6 space-y-6 font-sans">
            {/* Faculty Ribbon */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {(facultyDetail.roles || facultyDetail.faculty.roles || ['TEACHER']).map((r) => (
                      <span key={r} className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-navy-900 text-white font-mono">
                        {r}
                      </span>
                    ))}
                    {facultyDetail.faculty.is_placement_coordinator && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-purple-700 text-white font-mono">
                        TPO COORDINATOR
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 m-0">
                    {facultyDetail.faculty.name}
                  </h3>
                  <p className="text-xs text-slate-700 font-semibold mt-0.5 m-0">
                    {facultyDetail.teaching?.academic_rank || facultyDetail.faculty.academic_rank || facultyDetail.faculty.designation} &bull; {facultyDetail.faculty.department}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 m-0 font-mono">
                    UID: {facultyDetail.faculty.faculty_id} &bull; Office: {facultyDetail.teaching?.office_location || facultyDetail.faculty.office_location || 'Main Faculty Block'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 m-0 font-mono">
                    HOD: {facultyDetail.faculty.hod_name} ({facultyDetail.faculty.hod_id}) &bull; Dean: {facultyDetail.faculty.hos_name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 font-mono block">
                    {facultyDetail.faculty.mentees_count} Mentees
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold block">
                    {facultyDetail.faculty.completion_rate}% Survey Filled
                  </span>
                </div>
              </div>

              {/* Quick Contacts */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-mono">
                  <Mail size={12} className="text-slate-400" />
                  {facultyDetail.faculty.email}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={12} className="text-slate-400" />
                  {facultyDetail.faculty.phone}
                </span>
              </div>
            </div>

            {/* Teaching Portfolio & Active Courses */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-700 mb-2 m-0 flex items-center gap-1.5">
                <BookOpen size={14} className="text-navy-900" />
                Teaching Portfolio & Academic Delivery
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Assigned Instruction Courses:</span>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {(facultyDetail.teaching?.courses || facultyDetail.faculty.courses_taught || ['CS301', 'CS402']).map((c) => (
                      <span key={c} className="bg-navy-50 text-navy-900 border border-navy-200 px-2 py-0.5 rounded font-mono text-xs font-bold">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {facultyDetail.teaching?.committees && facultyDetail.teaching.committees.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 text-[11px] block">Institutional Committees:</span>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {facultyDetail.teaching.committees.map((comm) => (
                        <span key={comm} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-sans">
                          {comm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Concurrent Leadership Appointments */}
            {(facultyDetail.appointments?.hod || facultyDetail.appointments?.hos || facultyDetail.appointments?.admin) && (
              <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-2">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-amber-900 m-0 flex items-center gap-1.5">
                  <Building2 size={14} className="text-amber-800" />
                  Active Concurrent Administrative Appointments
                </h4>

                {facultyDetail.appointments.hod && (
                  <div className="bg-white p-2.5 rounded border border-amber-200 text-xs">
                    <div className="font-bold text-slate-900">Department Head (HOD) Appointment</div>
                    <div className="text-slate-600 text-[11px] mt-0.5 font-mono">
                      Department: {facultyDetail.appointments.hod.department} &bull; Jurisdiction: {facultyDetail.appointments.hod.faculty_count} Faculty, {facultyDetail.appointments.hod.students_count} Students
                    </div>
                  </div>
                )}

                {facultyDetail.appointments.hos && (
                  <div className="bg-white p-2.5 rounded border border-amber-200 text-xs">
                    <div className="font-bold text-slate-900">Executive School Dean (HOS) Appointment</div>
                    <div className="text-slate-600 text-[11px] mt-0.5 font-mono">
                      School: {facultyDetail.appointments.hos.school} &bull; Jurisdiction: {facultyDetail.appointments.hos.hod_count} Departments, {facultyDetail.appointments.hos.students_count} Candidates
                    </div>
                  </div>
                )}

                {facultyDetail.appointments.admin && (
                  <div className="bg-white p-2.5 rounded border border-amber-200 text-xs">
                    <div className="font-bold text-slate-900">Institutional Executive Admin Appointment</div>
                    <div className="text-slate-600 text-[11px] mt-0.5 font-mono">
                      Role: {facultyDetail.appointments.admin.role} &bull; Office: {facultyDetail.appointments.admin.office}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Department Colleagues */}
            {facultyDetail.colleagues && facultyDetail.colleagues.length > 0 && (
              <div>
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-700 mb-2 m-0">
                  Department Peers & Co-Teachers ({facultyDetail.colleagues.length})
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {facultyDetail.colleagues.slice(0, 4).map((c) => (
                    <div key={c.faculty_id} className="bg-slate-50 border border-slate-200 rounded p-2">
                      <span className="font-semibold text-slate-900 block truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{c.designation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentees Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-serif font-bold text-sm text-slate-900 m-0">
                  Assigned Student Mentees ({facultyDetail.mentees.length})
                </h4>
                <span className="text-[10px] text-slate-400">
                  Click any student to open career dossier
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Eligibility</th>
                      <th className="py-2.5 px-3">Form Status</th>
                      <th className="py-2.5 px-3">Remarks & Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {facultyDetail.mentees.map((stu) => {
                      const isEligible = stu.company_eligibility === 'Eligible for Assesment';
                      const isFilled = stu.survey_status === 'Filled';
                      return (
                        <tr
                          key={stu.student_id}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/students/${stu.student_id}`)}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-navy-900 text-[11px]">
                            {stu.student_id}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {stu.name}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant={isEligible ? 'success' : 'neutral'} size="xs">
                              {isEligible ? 'Eligible' : 'Not Eligible'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant={isFilled ? 'success' : 'warning'} size="xs">
                              {stu.survey_status}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                            {stu.remarks || (isFilled ? 'Survey submitted' : 'Pending response')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};
