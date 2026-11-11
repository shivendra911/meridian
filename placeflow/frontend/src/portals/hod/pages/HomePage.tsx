/**
 * PlaceFlow / Meridian — HOD Executive Command Home (Phase 6).
 *
 * Department-level KPIs: placement rate, curriculum approvals, at-risk students, faculty workload.
 * Includes "What needs me now" actionable task center.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Award,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button, TaskCard, useDocumentTitle } from '../../../ui';

export const HodHomePage: React.FC = () => {
  useDocumentTitle('Department Administration (HOD)');
  const { me } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title={`Department Leadership — ${me?.display_name || 'Dr. Sweety Sehgal'}`}
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
              title: 'Approve 3 pending NEP curriculum elective revisions',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 2),
              priority: 'HIGH',
              icon: BookOpen,
              action_label: 'Review Electives',
            }}
            onAction={() => navigate('/hod/curriculum')}
          />
          <TaskCard
            data={{
              task_id: 'task_at_risk_students',
              title: 'Review 12 at-risk student academic performance dossiers',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 3),
              priority: 'HIGH',
              icon: AlertTriangle,
              action_label: 'Audit Dossiers',
            }}
            onAction={() => navigate('/hod/students')}
          />
          <TaskCard
            data={{
              task_id: 'task_faculty_workload',
              title: 'Audit faculty teaching workload & advising distribution',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 5),
              priority: 'MEDIUM',
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
          label="Department Placement Rate"
          value="84.6%"
          hint="214 / 253 Eligible Students Placed"
          icon={Award}
        />
        <StatCard
          label="Pending Curriculum Approvals"
          value={3}
          hint="NEP syllabus revisions"
          icon={CheckSquare}
        />
        <StatCard
          label="At-Risk Students"
          value={12}
          hint="Attendance < 75% or Backlogs > 0"
          icon={AlertTriangle}
        />
        <StatCard
          label="Teaching Faculty Load"
          value="14.2 hrs"
          hint="Weekly average classroom contact"
          icon={Users}
        />
      </div>

      {/* 3. Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Department Placement Standing" subtitle="Cohort breakdown for 2026 graduating batch">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Super Dream (&gt;10 LPA)</span>
              <span className="font-bold text-ink font-mono">54 Placed (21.3%)</span>
            </div>
            <div className="w-full bg-line rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '21.3%' }} />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-ink-muted">Dream (6-10 LPA)</span>
              <span className="font-bold text-ink font-mono">112 Placed (44.3%)</span>
            </div>
            <div className="w-full bg-line rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '44.3%' }} />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-ink-muted">Regular (&lt;6 LPA)</span>
              <span className="font-bold text-ink font-mono">48 Placed (18.9%)</span>
            </div>
            <div className="w-full bg-line rounded-full h-2">
              <div className="bg-slate-500 h-2 rounded-full" style={{ width: '18.9%' }} />
            </div>
          </div>
        </Card>

        <Card title="Quick Governance Actions" subtitle="Administrative tasks for department head">
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/hod/curriculum')}
              className="w-full p-3 rounded-lg border border-line bg-canvas hover:bg-slate-100 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-brand" />
                <span className="font-semibold text-ink">Curriculum &amp; Course Syllabus Revision</span>
              </div>
              <ArrowRight size={13} className="text-ink-muted" />
            </button>

            <button
              onClick={() => navigate('/hod/faculty')}
              className="w-full p-3 rounded-lg border border-line bg-canvas hover:bg-slate-100 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-brand" />
                <span className="font-semibold text-ink">Faculty Workload &amp; Mentee Allocation</span>
              </div>
              <ArrowRight size={13} className="text-ink-muted" />
            </button>

            <button
              onClick={() => navigate('/hod/placements')}
              className="w-full p-3 rounded-lg border border-line bg-canvas hover:bg-slate-100 transition-colors flex items-center justify-between text-xs cursor-pointer"
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
