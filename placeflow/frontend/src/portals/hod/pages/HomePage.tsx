/**
 * PlaceFlow / Meridian — HOD Executive Command Home (Phase 6).
 *
 * Department-level KPIs: placement rate, curriculum approvals, at-risk students, faculty workload.
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
import { PageHeader, StatCard, Card, Badge, Button } from '../../../ui';

export const HodHomePage: React.FC = () => {
  const { me } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 font-sans">
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

      {/* KPI Row */}
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
          hint="Attendance < 75% or 2+ backlogs"
          icon={AlertTriangle}
        />
        <StatCard
          label="Faculty Teaching Strength"
          value={28}
          hint="Avg workload: 14 hrs/week"
          icon={Users}
        />
      </div>

      {/* Overview Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Department Placement Funnel" subtitle="Current status of CSE graduating batch">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-ink mb-1">
                <span>Super Dream Offers (&gt;10 LPA)</span>
                <span className="font-mono text-brand">48 students (19%)</span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div className="bg-brand h-full rounded-full" style={{ width: '19%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-ink mb-1">
                <span>Dream Offers (6-10 LPA)</span>
                <span className="font-mono text-emerald-600">112 students (44%)</span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '44%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-ink mb-1">
                <span>Regular Offers (&lt;6 LPA)</span>
                <span className="font-mono text-slate-600">54 students (21%)</span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div className="bg-slate-500 h-full rounded-full" style={{ width: '21%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-ink mb-1">
                <span>Unplaced / In Process</span>
                <span className="font-mono text-amber-600">39 students (16%)</span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '16%' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Curriculum &amp; Academic Milestones" subtitle="Board of Studies (BoS) agenda & syllabus tracking">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-line bg-canvas flex items-start justify-between">
              <div>
                <span className="font-bold text-ink">CS502: Distributed Systems &amp; Kubernetes</span>
                <p className="text-[11px] text-ink-muted mt-0.5">Elective module syllabus update proposed by Prof. Swathy.</p>
              </div>
              <Badge variant="institutional" size="xs">Needs Sign-off</Badge>
            </div>

            <div className="p-3 rounded-lg border border-line bg-canvas flex items-start justify-between">
              <div>
                <span className="font-bold text-ink">CS401: Artificial Intelligence Ethics &amp; DPDP</span>
                <p className="text-[11px] text-ink-muted mt-0.5">Statutory alignment with national DPDP Act guidelines.</p>
              </div>
              <Badge variant="success" size="xs">Attested</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/hod/students')}>
          <span>Department Students</span>
          <ArrowRight size={13} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/hod/faculty')}>
          <span>Faculty Roster</span>
          <ArrowRight size={13} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/hod/curriculum')}>
          <span>Curriculum Approvals</span>
          <ArrowRight size={13} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/hod/placements')}>
          <span>Placement Outcomes</span>
          <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  );
};

