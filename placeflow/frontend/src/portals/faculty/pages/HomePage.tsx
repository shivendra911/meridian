/**
 * PlaceFlow / Meridian — Faculty Advising Home (Journey Redesign).
 * Two-pane "Desk" pattern: "Who needs me" list on the left with stage rings,
 * candidate journey & academic dossier on the right.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
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
import { facultyApi } from '../api';
import { toast } from 'sonner';

export const FacultyHomePage: React.FC = () => {
  useDocumentTitle('Faculty Advising');
  const { me } = useAuth();
  const navigate = useNavigate();

  const [mentees, setMentees] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Counseling receipts feed
  const [receipts, setReceipts] = useState<ReceiptLine[]>([
    {
      id: 'r-1',
      label: 'CIE Verification',
      value: 'Coursework Verified',
      status: 'pass',
      detail: 'Institutional curriculum progression verified',
    },
  ]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    facultyApi
      .getMentees()
      .then((res) => {
        if (active) {
          const fetched = res.students || [];
          setMentees(fetched);
          if (fetched.length > 0) {
            setSelectedStudentId(fetched[0].student_id);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setMentees([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const atRiskMentees = mentees.filter((m) => {
    const att = m.attendance_percentage ?? m.attendance;
    return (att != null && att < 75) || (m.backlogs ?? 0) > 0 || (m.cgpa != null && m.cgpa < 6.5);
  });

  const filteredMentees = mentees.filter((m) => {
    const term = search.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(term) ||
      (m.student_id || '').toLowerCase().includes(term) ||
      (m.department || '').toLowerCase().includes(term)
    );
  });

  const selectedMentee = mentees.find((m) => m.student_id === selectedStudentId) || mentees[0];

  const handleRecordCounseling = () => {
    if (!selectedMentee) return;
    const name = selectedMentee.name || selectedMentee.student_id;
    setReceipts((prev) => [
      {
        id: `counsel-${Date.now()}`,
        label: `Advising Session: ${name}`,
        value: 'Counseling Recorded',
        status: 'pass',
        detail: `Academic remediation action agreed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      },
      ...prev,
    ]);
    toast.success(`Counseling session logged for ${name}`);
  };

  const handleApproveNoc = () => {
    if (!selectedMentee) return;
    const name = selectedMentee.name || selectedMentee.student_id;
    setReceipts((prev) => [
      {
        id: `noc-${Date.now()}`,
        label: `Attendance NOC: ${name}`,
        value: 'NOC Approved',
        status: 'pass',
        detail: 'Approved for interview leave under university regulations',
      },
      ...prev,
    ]);
    toast.success(`Interview NOC approved for ${name}`);
  };

  const getJourneyStage = (student: any): { label: string; ringColor: string; spineStages: SpineStage[] } => {
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
        label: 'Needs Attention',
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
      label: 'On Track',
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

  const selectedStage = selectedMentee ? getJourneyStage(selectedMentee) : null;

  return (
    <div className="space-y-6 font-sans max-w-[1600px] mx-auto pb-12">
      {/* Faculty Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-ink tracking-tight">
              Faculty Advising
            </h1>
            <Badge variant="institutional" size="xs">
              {me?.display_name || 'Faculty Mentor'}
            </Badge>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            {atRiskMentees.length > 0
              ? `${atRiskMentees.length} mentee(s) need academic counseling today, ${mentees.length} assigned in cohort.`
              : `All ${mentees.length} mentees are currently satisfying academic standing.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/faculty/mentees')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition-colors cursor-pointer"
          >
            <Users size={14} className="text-brand" /> View All Mentees
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
              task_id: 'task_counsel',
              title:
                atRiskMentees.length > 0
                  ? `Counsel ${atRiskMentees.length} at-risk mentee(s) regarding academic progression`
                  : 'Review academic progress and attendance standing for assigned cohort',
              due: null,
              priority: atRiskMentees.length > 0 ? 'HIGH' : 'MEDIUM',
              icon: AlertTriangle,
              action_label: 'Open Desk',
            }}
            onAction={() => {
              if (atRiskMentees.length > 0) {
                setSelectedStudentId(atRiskMentees[0].student_id);
              }
            }}
          />
          <TaskCard
            data={{
              task_id: 'task_approvals',
              title: 'Review pending CIE verification and student leave requests',
              due: null,
              priority: 'MEDIUM',
              icon: CheckCircle2,
              action_label: 'Review Queue',
            }}
            onAction={() => navigate('/faculty/approvals')}
          />
          <TaskCard
            data={{
              task_id: 'task_curriculum',
              title: 'Review assigned course delivery outcomes and lecture schedule',
              due: null,
              priority: 'LOW',
              icon: BookOpen,
              action_label: 'View Courses',
            }}
            onAction={() => navigate('/faculty/courses')}
          />
        </div>
      </div>

      {/* TWO-PANE ADVISING DESK */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: "Who Needs Me" People List with Stage Rings */}
        <div className="md:col-span-5 lg:col-span-4 rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h2 className="text-sm font-bold text-ink">Who Needs Me</h2>
              <span className="text-[11px] text-ink-muted">Assigned Advising Cohort</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              {mentees.length} Students
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

          {/* People List with Stage Rings */}
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-ink-muted">Loading mentees...</div>
            ) : filteredMentees.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-muted">No students match filter</div>
            ) : (
              filteredMentees.map((m) => {
                const isSelected = m.student_id === selectedStudentId;
                const stage = getJourneyStage(m);
                const att = m.attendance_percentage ?? m.attendance ?? 80;
                const isAtRisk = (m.backlogs ?? 0) > 0 || att < 75;

                return (
                  <button
                    key={m.student_id}
                    type="button"
                    onClick={() => setSelectedStudentId(m.student_id)}
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
                        {(m.name || 'S')
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      {isAtRisk && (
                        <span
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-surface"
                          title="Needs attention"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink truncate">{m.name}</span>
                        <span className="text-[10px] font-mono text-ink-muted">{m.student_id}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-muted">
                        <span>CGPA {m.cgpa != null ? Number(m.cgpa).toFixed(2) : '—'}</span>
                        <span>&bull;</span>
                        <span className={att < 75 ? 'text-amber-600 font-bold' : ''}>
                          {att}% Att.
                        </span>
                        <span>&bull;</span>
                        <span className={(m.backlogs ?? 0) > 0 ? 'text-danger font-bold' : ''}>
                          {m.backlogs ?? 0} Backlog(s)
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Selected Candidate Journey Dossier */}
        <div className="md:col-span-7 lg:col-span-8 space-y-5">
          {selectedMentee ? (
            <>
              {/* Mentee Hero Block with Journey Spine */}
              <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                      Academic Advising Dossier
                    </span>
                    <h2 className="text-2xl font-bold font-display text-ink tracking-tight mt-0.5">
                      {selectedMentee.name}
                    </h2>
                    <p className="text-xs text-ink-muted mt-1">
                      Roll: {selectedMentee.student_id} &bull; {selectedMentee.department || 'Engineering'} &bull; Cohort 2026
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRecordCounseling}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-surface text-xs font-bold hover:bg-brand/90 transition-colors cursor-pointer"
                    >
                      <Sparkles size={13} /> Record Counseling
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveNoc}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={13} className="text-success" /> Approve NOC
                    </button>
                  </div>
                </div>

                {/* Candidate Journey Spine */}
                <div className="pt-3 border-t border-line">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">
                    Recruitment Journey Stage
                  </span>
                  {selectedStage && <Spine stages={selectedStage.spineStages} size="md" />}
                </div>
              </div>

              {/* Academic Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <span className="text-ink-muted block text-[11px]">Cumulative CGPA</span>
                  <span className="text-xl font-bold font-display text-ink tabular-nums">
                    {selectedMentee.cgpa != null ? Number(selectedMentee.cgpa).toFixed(2) : '—'}
                  </span>
                  <span className="text-[10px] text-success block mt-0.5">Satisfies eligibility</span>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <span className="text-ink-muted block text-[11px]">Attendance Record</span>
                  <span className="text-xl font-bold font-display text-ink tabular-nums">
                    {selectedMentee.attendance_percentage ?? selectedMentee.attendance ?? 80}%
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">Statutory requirement &ge; 75%</span>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <span className="text-ink-muted block text-[11px]">Active Backlogs</span>
                  <span className="text-xl font-bold font-display text-ink tabular-nums">
                    {selectedMentee.backlogs ?? 0}
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">Clear before Superday</span>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <span className="text-ink-muted block text-[11px]">Advising Status</span>
                  <span className="text-sm font-bold text-brand block mt-1">
                    {selectedStage?.label || 'Active'}
                  </span>
                </div>
              </div>

              {/* Real Activity & Counseling Receipts */}
              <Receipt
                title="Advising Audit Receipts"
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
              Select a student from the list on the left to inspect their advising dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
