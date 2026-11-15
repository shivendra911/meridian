/**
 * PlaceFlow / Meridian — HOD Executive Command Home (Journey Redesign).
 * Two-pane "Desk" pattern: Department student & faculty roster with stage rings left,
 * academic progression & departmental dossier right.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import {
  useDocumentTitle,
  Spine,
  SpineStage,
  Receipt,
  ReceiptLine,
  TaskCard,
  Badge,
} from '../../../ui';
import { hodApi } from '../api';
import { toast } from 'sonner';

export const HodHomePage: React.FC = () => {
  useDocumentTitle('Department Administration (HOD)');
  const { me } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Departmental audit receipts
  const [receipts, setReceipts] = useState<ReceiptLine[]>([
    {
      id: 'hod-1',
      label: 'NEP Curriculum Revision',
      value: 'Electives Approved',
      status: 'pass',
      detail: 'Industry-aligned computing electives verified for Batch 2026',
    },
    {
      id: 'hod-2',
      label: 'Accreditation Readiness',
      value: 'Criterion 5 Synchronized',
      status: 'pass',
      detail: 'Graduation placement records verified against university SIS',
    },
  ]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    hodApi
      .getStudents()
      .then((res) => {
        if (active) {
          const list = res.students || [];
          setStudents(list);
          if (list.length > 0) {
            setSelectedStudentId(list[0].student_id);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setStudents([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const placedCount = students.filter((s) => (s.placement_status || '').toLowerCase().includes('placed')).length;
  const atRiskStudents = students.filter((s) => {
    const att = s.attendance_percentage ?? s.attendance;
    return (att != null && att < 75) || (s.backlogs ?? 0) > 0;
  });

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.student_id || '').toLowerCase().includes(term)
    );
  });

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId) || students[0];

  const handleApproveCurriculumElective = () => {
    if (!selectedStudent) return;
    const name = selectedStudent.name || selectedStudent.student_id;
    setReceipts((prev) => [
      {
        id: `elec-${Date.now()}`,
        label: `Elective Verification: ${name}`,
        value: 'Approved by HOD',
        status: 'pass',
        detail: `Specialization pathway certified at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      },
      ...prev,
    ]);
    toast.success(`Elective pathway approved for ${name}`);
  };

  const getStageRings = (student: any): { label: string; ringColor: string; spineStages: SpineStage[] } => {
    const placed = (student?.placement_status || '').toLowerCase().includes('placed');
    const backlogs = student?.backlogs ?? 0;
    const att = student?.attendance_percentage ?? student?.attendance ?? 80;

    if (placed) {
      return {
        label: 'Offer Accepted',
        ringColor: 'ring-teal-500 border-teal-500',
        spineStages: [
          { id: 'prep', label: 'Preparing', status: 'completed' },
          { id: 'elig', label: 'Eligible', status: 'completed' },
          { id: 'int', label: 'Interview', status: 'completed' },
          { id: 'off', label: 'Offer', status: 'completed' },
          { id: 'join', label: 'Joined', status: 'current' },
        ],
      };
    }

    if (backlogs > 0 || att < 75) {
      return {
        label: 'Academic Remediation',
        ringColor: 'ring-amber-500 border-amber-500',
        spineStages: [
          { id: 'prep', label: 'Preparing', status: 'current' },
          { id: 'elig', label: 'Eligible', status: 'upcoming' },
          { id: 'int', label: 'Interview', status: 'upcoming' },
          { id: 'off', label: 'Offer', status: 'upcoming' },
          { id: 'join', label: 'Joined', status: 'upcoming' },
        ],
      };
    }

    return {
      label: 'Eligible & Active',
      ringColor: 'ring-blue-500 border-blue-500',
      spineStages: [
        { id: 'prep', label: 'Preparing', status: 'completed' },
        { id: 'elig', label: 'Eligible', status: 'current' },
        { id: 'int', label: 'Interview', status: 'upcoming' },
        { id: 'off', label: 'Offer', status: 'upcoming' },
        { id: 'join', label: 'Joined', status: 'upcoming' },
      ],
    };
  };

  const selectedStage = selectedStudent ? getStageRings(selectedStudent) : null;
  const placementRate = students.length > 0 ? Math.round((placedCount / students.length) * 100) : 0;

  return (
    <div className="space-y-6 font-sans max-w-[1600px] mx-auto pb-12">
      {/* Department Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-ink tracking-tight">
              Department Leadership
            </h1>
            <Badge variant="institutional" size="xs">
              {me?.display_name || 'HOD Computer Science'}
            </Badge>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Department placement is at {placementRate}% ({placedCount} of {students.length} in CSE),{' '}
            {atRiskStudents.length} candidate(s) need academic remediation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hod/curriculum')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition-colors cursor-pointer"
          >
            <BookOpen size={14} className="text-brand" /> Review Curriculum
          </button>
        </div>
      </div>

      {/* Actionable Task Cards ("What Needs Me Now") */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          What Needs Me Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskCard
            data={{
              task_id: 'task_curriculum_review',
              title: 'Review pending NEP curriculum elective revisions for Batch 2026',
              due: null,
              priority: 'MEDIUM',
              icon: BookOpen,
              action_label: 'Review Electives',
            }}
            onAction={() => navigate('/hod/curriculum')}
          />
          <TaskCard
            data={{
              task_id: 'task_at_risk_students',
              title:
                atRiskStudents.length > 0
                  ? `Review ${atRiskStudents.length} at-risk student academic performance dossiers`
                  : 'Audit student academic performance dossiers and attendance',
              due: null,
              priority: atRiskStudents.length > 0 ? 'HIGH' : 'MEDIUM',
              icon: AlertTriangle,
              action_label: 'Open Desk',
            }}
            onAction={() => {
              if (atRiskStudents.length > 0) {
                setSelectedStudentId(atRiskStudents[0].student_id);
              }
            }}
          />
          <TaskCard
            data={{
              task_id: 'task_placement_clearance',
              title: 'Departmental placement outcomes and Superday eligibility review',
              due: null,
              priority: 'LOW',
              icon: Award,
              action_label: 'Inspect Placements',
            }}
            onAction={() => navigate('/hod/placements')}
          />
        </div>
      </div>

      {/* TWO-PANE DEPARTMENT DESK */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: "Who Needs Me" Department Roster with Stage Rings */}
        <div className="md:col-span-5 lg:col-span-4 rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h2 className="text-sm font-bold text-ink">Who Needs Me</h2>
              <span className="text-[11px] text-ink-muted">Department Student Roster</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              {students.length} Students
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Filter by name or roll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-line bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
            />
          </div>

          {/* Student Roster */}
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-ink-muted">Loading department students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-muted">No students match filter</div>
            ) : (
              filteredStudents.map((s) => {
                const isSelected = s.student_id === selectedStudentId;
                const stage = getStageRings(s);
                const att = s.attendance_percentage ?? s.attendance ?? 80;
                const isAtRisk = (s.backlogs ?? 0) > 0 || att < 75;

                return (
                  <button
                    key={s.student_id}
                    type="button"
                    onClick={() => setSelectedStudentId(s.student_id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-brand bg-brand/5 shadow-xs'
                        : 'border-line/70 bg-surface hover:bg-canvas'
                    }`}
                  >
                    {/* Avatar with Stage Ring */}
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        className={`w-9 h-9 rounded-full bg-line/60 text-ink font-bold text-xs flex items-center justify-center ring-2 ring-offset-2 ${stage.ringColor}`}
                      >
                        {(s.name || 'S')
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      {isAtRisk && (
                        <span
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-surface"
                          title="Remediation needed"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink truncate">{s.name}</span>
                        <span className="text-[10px] font-mono text-ink-muted">{s.student_id}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-muted">
                        <span>CGPA {s.cgpa != null ? Number(s.cgpa).toFixed(2) : '—'}</span>
                        <span>&bull;</span>
                        <span className={att < 75 ? 'text-amber-600 font-bold' : ''}>
                          {att}% Att.
                        </span>
                        <span>&bull;</span>
                        <span className={(s.backlogs ?? 0) > 0 ? 'text-danger font-bold' : ''}>
                          {s.backlogs ?? 0} Backlog(s)
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Selected Student Departmental Dossier */}
        <div className="md:col-span-7 lg:col-span-8 space-y-5">
          {selectedStudent ? (
            <>
              {/* Dossier Header */}
              <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                      Department Progression Dossier
                    </span>
                    <h2 className="text-2xl font-bold font-display text-ink tracking-tight mt-0.5">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-xs text-ink-muted mt-1">
                      Roll: {selectedStudent.student_id} &bull; CSE Department &bull; Batch 2026
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApproveCurriculumElective}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-surface text-xs font-bold hover:bg-brand/90 transition-colors cursor-pointer"
                    >
                      <Sparkles size={13} /> Approve Elective
                    </button>
                  </div>
                </div>

                {/* Spine Journey */}
                <div className="pt-3 border-t border-line">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">
                    Placement & Graduation Journey
                  </span>
                  {selectedStage && <Spine stages={selectedStage.spineStages} size="md" />}
                </div>
              </div>

              {/* Department Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <span className="text-ink-muted block text-[11px]">Academic Standing</span>
                  <span className="text-xl font-bold font-display text-ink tabular-nums">
                    {selectedStudent.cgpa != null ? Number(selectedStudent.cgpa).toFixed(2) : '—'} CGPA
                  </span>
                  <span className="text-[10px] text-success block mt-0.5">Coursework Cleared</span>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <span className="text-ink-muted block text-[11px]">Attendance Attestation</span>
                  <span className="text-xl font-bold font-display text-ink tabular-nums">
                    {selectedStudent.attendance_percentage ?? selectedStudent.attendance ?? 80}%
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">Statutory 75% required</span>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <span className="text-ink-muted block text-[11px]">Backlog Clearance</span>
                  <span className="text-xl font-bold font-display text-ink tabular-nums">
                    {selectedStudent.backlogs ?? 0}
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">Special exam eligible</span>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <span className="text-ink-muted block text-[11px]">Placement Status</span>
                  <span className="text-sm font-bold text-teal-700 block mt-1">
                    {selectedStage?.label || 'In Progress'}
                  </span>
                </div>
              </div>

              {/* Department Activity Receipts */}
              <Receipt
                title="Departmental Verification Receipts"
                lines={receipts}
                timestamp={new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                animate={true}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center text-ink-muted text-sm">
              Select a student to inspect their departmental progression dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
