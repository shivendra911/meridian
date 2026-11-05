import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Student } from '../types';
import { VtiBadge } from '../components/common/VtiBadge';
import {
  Search,
  LayoutGrid,
  Table,
  Activity,
  ChevronRight,
  Sliders,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { AdvancedDataGrid, ColumnDef } from '../components/ui/AdvancedDataGrid';
import { Button } from '../components/ui/Button';

interface StudentsPageProps {
  onSelectStudent: (studentId: string) => void;
  onOpenWhatIf: (studentId: string) => void;
  onOpenConsent: (studentId: string) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({
  onSelectStudent,
  onOpenWhatIf,
  onOpenConsent,
}) => {
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
        <span className="font-mono font-bold text-[#0B1B3D] text-xs">{s.student_id}</span>
      ),
    },
    {
      key: 'name',
      header: 'Candidate Identity',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
            {s.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">{s.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">{s.email}</span>
          </div>
        </div>
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
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
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
            onClick={() => onOpenWhatIf(s.student_id)}
            className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-[#8C1515] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1"
            title="Run What-If Career Simulation"
          >
            <Sliders size={11} />
            <span>Simulate</span>
          </button>
          <button
            onClick={() => onOpenConsent(s.student_id)}
            className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1"
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
      <div className="bg-white border-l-4 border-l-[#0B1B3D] border border-slate-200 rounded p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            OFFICIAL REGISTRAR &bull; CANDIDATE DIRECTORY
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
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
                  ? 'bg-[#0B1B3D] text-white shadow-2xs'
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
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#8C1515] focus:outline-hidden font-mono"
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
          onRowClick={(s) => onSelectStudent(s.student_id)}
          bulkActions={[
            {
              label: 'Export Selected to CSV',
              action: (selected) =>
                alert(`Exporting ${selected.length} candidate dossiers as signed CSV.`),
              variant: 'outline',
            },
            {
              label: 'Request DPDP Verification',
              action: (selected) =>
                alert(`Triggered DigiLocker APAAR consent verification for ${selected.length} students.`),
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
                    <div className="w-10 h-10 rounded-full bg-[#0B1B3D] text-white flex items-center justify-center font-bold font-serif text-sm">
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 m-0">{student.name}</h3>
                      <div className="text-[11px] font-mono text-slate-500">
                        {student.student_id} &bull; {student.department}
                      </div>
                    </div>
                  </div>
                  <VtiBadge vti={student.vti} />
                </div>

                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-center my-3 bg-slate-50/50 rounded">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium">CGPA</div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {student.cgpa.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Backlogs</div>
                    <div
                      className={`text-sm font-bold font-mono ${
                        student.backlogs > 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {student.backlogs}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Status</div>
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
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                          +{student.skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectStudent(student.student_id)}
                  className="text-xs font-semibold text-[#8C1515] hover:underline flex items-center gap-1"
                >
                  <span>Open Dossier</span>
                  <ChevronRight size={13} />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenWhatIf(student.student_id)}
                    className="p-1.5 text-slate-600 hover:text-[#8C1515] bg-slate-100 hover:bg-slate-200 rounded"
                    title="Run What-If Simulation"
                  >
                    <Sliders size={13} />
                  </button>
                  <button
                    onClick={() => onOpenConsent(student.student_id)}
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

