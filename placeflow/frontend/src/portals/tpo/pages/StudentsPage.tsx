import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Student } from '../../../types';
import { VtiBadge } from '../../../components/common/VtiBadge';
import {
  Search,
  LayoutGrid,
  Table,
  Activity,
  ChevronRight,
  Sliders,
  Shield} from 'lucide-react';
import { AdvancedDataGrid, ColumnDef } from '../../../components/ui/AdvancedDataGrid';
import { toast } from 'sonner';
import { PersonChip, useDocumentTitle } from '../../../ui';

interface StudentsPageProps {
  onSelectStudent?: (studentId: string) => void;
  onOpenWhatIf?: (studentId: string) => void;
  onOpenConsent?: (studentId: string) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({
  onSelectStudent,
  onOpenWhatIf,
  onOpenConsent,
}) => {
  const navigate = useNavigate();
  useDocumentTitle('Candidate Registry');
  const handleSelectStudent = (sid: string) => {
    if (onSelectStudent) onSelectStudent(sid);
    else navigate('/tpo/students/' + sid);
  };
  const handleOpenWhatIf = (sid: string) => {
    if (onOpenWhatIf) onOpenWhatIf(sid);
    else navigate('/tpo/students/' + sid);
  };
  const handleOpenConsent = (sid: string) => {
    if (onOpenConsent) onOpenConsent(sid);
    else navigate('/tpo/students/' + sid);
  };
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const departments = ['ALL', 'CSE', 'ISE', 'ECE', 'EEE', 'ME', 'CE', 'IT'];

  const loadStudents = () => {
    setLoading(true);
    api
      .getStudents(selectedDept === 'ALL' ? undefined : selectedDept, search || undefined)
      .then((res) => {
        setStudents(res.students);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, [selectedDept]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  // AdvancedDataGrid column definitions
  const columns: ColumnDef<Student>[] = [
    {
      key: 'student_id',
      header: 'Roll Number',
      sortable: true,
      render: (s) => (
        <span className="font-mono font-bold text-navy-900 text-xs">{s.student_id}</span>
      ),
    },
    {
      key: 'name',
      header: 'Candidate Identity',
      sortable: true,
      render: (s) => (
        <PersonChip
          name={s.name}
          role={s.department}
          person_id={s.student_id}
          profileData={{
            person_id: s.student_id,
            name: s.name,
            reg_no: s.student_id,
            department: s.department,
            cgpa: s.cgpa,
            roles: ['Student Candidate'],
            is_verified: true,
            email: s.email,
            phone: s.phone,
          }}
          onClick={() => handleSelectStudent(s.student_id)}
        />
      ),
    },
    {
      key: 'department',
      header: 'Discipline',
      sortable: true,
      render: (s) => <span className="font-medium text-slate-700">{s.department}</span>,
    },
    {
      key: 'cgpa',
      header: 'CGPA',
      sortable: true,
      align: 'right',
      render: (s) => (
        <span
          className={`font-mono font-bold ${
            s.cgpa >= 8.5
              ? 'text-emerald-700'
              : s.cgpa >= 7.0
              ? 'text-blue-700'
              : s.cgpa < 6.0
              ? 'text-red-700'
              : 'text-slate-800'
          }`}
        >
          {s.cgpa.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'backlogs',
      header: 'Backlogs',
      sortable: true,
      align: 'center',
      render: (s) => (
        <span
          className={`font-mono font-bold ${
            s.backlogs > 0 ? 'text-red-600' : 'text-emerald-700'
          }`}
        >
          {s.backlogs}
        </span>
      ),
    },
    {
      key: 'mentor',
      header: 'Faculty Mentor & HOD',
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-800 block">{s.mentor_name || 'Unassigned'}</span>
          <span className="text-xs text-slate-400 font-mono">
            UID: {s.mentor_id || '-'} &bull; {s.hod_name || s.mentor_hod || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'assessment_status',
      header: 'Drive Assessment',
      sortable: true,
      render: (s) => {
        const isEligible = s.assessment_status === 'Eligible for Assesment';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
              isEligible
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {isEligible ? 'Eligible' : 'Not Eligible'}
          </span>
        );
      },
    },
    {
      key: 'survey_status',
      header: 'Survey Form',
      sortable: true,
      render: (s) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
            s.survey_status === 'Filled'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {s.survey_status || 'Pending'}
        </span>
      ),
    },
    {
      key: 'remarks',
      header: 'Mentor Notes',
      render: (s) => (
        <div className="max-w-xs truncate text-xs text-slate-500" title={s.remarks}>
          {s.placement_company ? (
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mr-1">
              Placed @ {s.placement_company}
            </span>
          ) : s.verification_issue ? (
            <span className="font-semibold text-cardinal bg-red-50 px-1.5 py-0.5 rounded mr-1">
              {s.verification_issue}
            </span>
          ) : null}
          {s.remarks || (s.survey_status === 'Filled' ? 'Confirmed' : '—')}
        </div>
      ),
    },
    {
      key: 'vti',
      header: 'Talent Authenticity',
      render: (s) => <VtiBadge vti={s.vti} />,
    },
    {
      key: 'placement_status',
      header: 'Placement Status',
      sortable: true,
      render: (s) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${
            s.placement_status === 'Placed'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              s.placement_status === 'Placed' ? 'bg-emerald-600' : 'bg-slate-400'
            }`}
          />
          {s.placement_status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleOpenWhatIf(s.student_id)}
            className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-cardinal bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1"
            title="Run What-If Career Simulation"
          >
            <Sliders size={11} />
            <span>Simulate</span>
          </button>
          <button
            onClick={() => handleOpenConsent(s.student_id)}
            className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1"
            title="Manage DPDP Consents"
          >
            <Shield size={11} />
            <span>Consents</span>
          </button>
        </div>
      ),
    },
  ];

  // Preset Views for Student Management (Section 13.1)
  const presetViews = [
    { id: 'all', label: 'All Candidates', count: students.length },
    {
      id: 'eligible',
      label: 'Placement Eligible',
      count: students.filter((s) => s.backlogs === 0 && s.cgpa >= 7.0).length,
      filterFn: (s: Student) => s.backlogs === 0 && s.cgpa >= 7.0,
    },
    {
      id: 'placed',
      label: 'Placed Offers',
      count: students.filter((s) => s.placement_status === 'Placed').length,
      filterFn: (s: Student) => s.placement_status === 'Placed',
    },
    {
      id: 'at_risk',
      label: 'At-Risk / Backlogs',
      count: students.filter((s) => s.backlogs > 0 || s.cgpa < 6.0).length,
      filterFn: (s: Student) => s.backlogs > 0 || s.cgpa < 6.0,
    },
    {
      id: 'honors',
      label: 'Academic Honors (CGPA >= 8.5)',
      count: students.filter((s) => s.cgpa >= 8.5).length,
      filterFn: (s: Student) => s.cgpa >= 8.5,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-l-4 border-l-navy-900 border border-slate-200 rounded p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">
            OFFICIAL REGISTRAR &bull; CANDIDATE DIRECTORY
          </div>
          <h1 className="text-xl font-bold  text-slate-900 m-0">
            Verified Candidate Registry
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Official candidate directory featuring Verified Talent Index (VTI) authenticity seals, predictive ML risk profiles, and academic transcripts.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-all ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Table size={13} />
            <span>Table Ledger</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-all ${
              viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <LayoutGrid size={13} />
            <span>Passport Dossiers</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-2">Discipline:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                selectedDept === dept
                  ? 'bg-navy-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name or roll..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-cardinal focus:outline-hidden font-mono"
          />
        </form>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
          <Activity className="animate-spin mr-2" size={18} />
          Loading Verified Registry Records...
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded p-12 text-center text-slate-500 text-xs">
          No candidates match the specified discipline or search filters.
        </div>
      ) : viewMode === 'table' ? (
        /* Advanced Data Workspace Grid (Section 13) */
        <AdvancedDataGrid
          data={students}
          columns={columns}
          rowKey={(s) => s.student_id}
          presetViews={presetViews}
          searchPlaceholder="Search candidate roll, name, department..."
          onRowClick={(s) => handleSelectStudent(s.student_id)}
          bulkActions={[
            {
              label: 'Export Selected to CSV',
              action: (selected) =>
                toast.success(`Exporting ${selected.length} candidate dossiers as signed CSV`),
              variant: 'outline',
            },
            {
              label: 'Request DPDP Verification',
              action: (selected) =>
                toast.info(`Triggered DigiLocker APAAR consent verification for ${selected.length} students`),
              variant: 'cardinal',
            },
          ]}
        />
      ) : (
        /* Passport Candidate Dossiers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student) => (
            <div
              key={student.student_id}
              className="bg-white border border-slate-200 rounded shadow-subtle p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <PersonChip
                      name={student.name}
                      role={student.department}
                      person_id={student.student_id}
                      profileData={{
                        person_id: student.student_id,
                        name: student.name,
                        reg_no: student.student_id,
                        department: student.department,
                        cgpa: student.cgpa,
                        roles: ['Student Candidate'],
                        is_verified: true,
                        email: student.email,
                        phone: student.phone,
                      }}
                      onClick={() => handleSelectStudent(student.student_id)}
                    />
                  </div>
                  <VtiBadge vti={student.vti} />
                </div>

                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-center my-3 bg-slate-50/50 rounded">
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-medium">CGPA</div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {student.cgpa.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Backlogs</div>
                    <div
                      className={`text-sm font-bold font-mono ${
                        student.backlogs > 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {student.backlogs}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Status</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {student.placement_status}
                    </div>
                  </div>
                </div>

                {student.skills && student.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10.5px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                      Verified Competencies:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {student.skills.slice(0, 4).map((sk) => (
                        <span
                          key={sk}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10.5px] font-mono border border-slate-200"
                        >
                          {sk}
                        </span>
                      ))}
                      {student.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 text-xs text-slate-400 font-mono">
                          +{student.skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleSelectStudent(student.student_id)}
                  className="text-xs font-semibold text-cardinal hover:underline flex items-center gap-1"
                >
                  <span>Open Dossier</span>
                  <ChevronRight size={13} />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenWhatIf(student.student_id)}
                    className="p-1.5 text-slate-600 hover:text-cardinal bg-slate-100 hover:bg-slate-200 rounded"
                    title="Run What-If Simulation"
                  >
                    <Sliders size={13} />
                  </button>
                  <button
                    onClick={() => handleOpenConsent(student.student_id)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded"
                    title="Manage DPDP Consents"
                  >
                    <Shield size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

