/**
 * PlaceFlow / Meridian — HOD Executive Command Home (Phase 6).
 *
 * Department-level KPIs: placement rate, curriculum approvals, at-risk students, faculty workload.
 * Includes "What needs me now" actionable task center.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Award,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button, TaskCard, useDocumentTitle } from '../../../ui';
import { hodApi } from '../api';

export const HodHomePage: React.FC = () => {
  useDocumentTitle('Department Administration (HOD)');
  const { me } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    hodApi
      .getStudents()
      .then((res) => {
        if (active) {
          setStudents(res.students || []);
        }
      })
      .catch(() => {
        if (active) {
          setStudents([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const placedCount = students.filter((s) => (s.placement_status || '').toLowerCase().includes('placed')).length;
  const atRiskCount = students.filter((s) => {
    const att = s.attendance_percentage ?? s.attendance;
    return (att != null && att < 75) || (s.backlogs ?? 0) > 0;
  }).length;
  const placementRate = students.length > 0 ? `${Math.round((placedCount / students.length) * 100)}%` : '—';

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title={`Department Leadership — ${me?.display_name || 'Department Head'}`}
        description="Head of Department administrative command: departmental placements, faculty workload, and curriculum approvals."
        badge={<Badge variant="institutional" size="xs">Department of CSE</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/hod/curriculum')}
            leftIcon={<BookOpen size={14} />}
          >
            Review Curriculum
          </Button>
        }
      />

      {/* 1. What Needs Me Now — Actionable TaskCards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          What Needs Me Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskCard
            data={{
              task_id: 'task_curriculum_review',
              title: 'Review pending NEP curriculum elective revisions',
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
              title: atRiskCount > 0
                ? `Review ${atRiskCount} at-risk student academic performance dossiers`
                : 'Audit student academic performance dossiers and attendance',
              due: null,
              priority: atRiskCount > 0 ? 'HIGH' : 'MEDIUM',
              icon: AlertTriangle,
              action_label: 'Audit Dossiers',
            }}
            onAction={() => navigate('/hod/students')}
          />
          <TaskCard
            data={{
              task_id: 'task_faculty_workload',
              title: 'Audit faculty teaching workload & advising distribution',
              due: null,
              priority: 'LOW',
              icon: Users,
              action_label: 'Faculty Roster',
            }}
            onAction={() => navigate('/hod/faculty')}
          />
        </div>
      </div>

      {/* 2. KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Department Cohort"
          value={students.length}
          hint="Enrolled Student Scope"
          icon={Users}
        />
        <StatCard
          label="Placement Rate"
          value={placementRate}
          hint={`${placedCount} / ${students.length} Candidates Placed`}
          icon={Award}
        />
        <StatCard
          label="At-Risk Students"
          value={atRiskCount}
          hint="Attendance < 75% or Backlogs > 0"
          icon={AlertTriangle}
        />
        <StatCard
          label="Approvals Queue"
          value="Active"
          hint="Board of Studies Sign-Off"
          icon={CheckSquare}
        />
      </div>

      {/* 3. Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Department Placement Standing" subtitle="Cohort breakdown for graduating batch">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Placed Candidates</span>
              <span className="font-semibold text-ink">{placedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Unplaced / In-Process Candidates</span>
              <span className="font-semibold text-ink">{Math.max(0, students.length - placedCount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">At-Risk Intervention Needed</span>
              <span className="font-semibold text-red-600">{atRiskCount}</span>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/hod/students')} className="w-full">
                View Full Student Registry &rarr;
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Quick Governance Actions" subtitle="Administrative tasks for department head">
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/hod/curriculum')}
              className="macos-press-sm w-full p-3 rounded-lg border border-line bg-canvas hover:bg-slate-100 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-brand" />
                <span className="font-semibold text-ink">Curriculum &amp; Course Syllabus Revision</span>
              </div>
              <ArrowRight size={13} className="text-ink-muted" />
            </button>

            <button
              onClick={() => navigate('/hod/faculty')}
              className="macos-press-sm w-full p-3 rounded-lg border border-line bg-canvas hover:bg-slate-100 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-brand" />
                <span className="font-semibold text-ink">Faculty Workload &amp; Mentee Allocation</span>
              </div>
              <ArrowRight size={13} className="text-ink-muted" />
            </button>

            <button
              onClick={() => navigate('/hod/placements')}
              className="macos-press-sm w-full p-3 rounded-lg border border-line bg-canvas hover:bg-slate-100 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Award size={16} className="text-brand" />
                <span className="font-semibold text-ink">Department Placement Analytics &amp; Reports</span>
              </div>
              <ArrowRight size={13} className="text-ink-muted" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
