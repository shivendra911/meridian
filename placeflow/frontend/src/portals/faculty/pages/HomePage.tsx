/**
 * PlaceFlow / Meridian — Faculty Advising Home (Phase 6).
 *
 * Surfaces mentees needing attention, academic verification queue, and scheduled lectures.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button, Skeleton } from '../../../ui';

export const FacultyHomePage: React.FC = () => {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title={`Faculty Advising — ${me?.display_name || 'Prof. Faculty'}`}
        description="Monitor student academic performance, verify coursework eligibility, and manage mentee counseling."
        badge={<Badge variant="institutional" size="xs">Faculty Workspace</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/faculty/mentees')}
            leftIcon={<Users size={14} />}
          >
            Review Mentees
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Mentees"
          value={18}
          hint="CSE Batch 2025/26"
          icon={Users}
        />
        <StatCard
          label="Mentees Needing Attention"
          value={3}
          hint="Attendance < 75% or CGPA < 7.0"
          icon={AlertTriangle}
        />
        <StatCard
          label="Teaching Sections"
          value={2}
          hint="CS301 & CS405"
          icon={BookOpen}
        />
        <StatCard
          label="Pending Approvals"
          value={4}
          hint="CIE verification & leave requests"
          icon={CheckSquare}
        />
      </div>

      {/* Today's Schedule & At-Risk Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Today's Teaching Schedule" subtitle="Scheduled timetable lectures and laboratory sessions">
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-line bg-canvas flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-ink">CS301: Distributed Operating Systems</div>
                <div className="text-[11px] text-ink-muted">Room LH-204 &bull; CSE Section B</div>
              </div>
              <Badge variant="institutional" size="xs">10:00 - 11:30 AM</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-line bg-canvas flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-ink">CS405: Cloud &amp; Distributed Systems Lab</div>
                <div className="text-[11px] text-ink-muted">Computing Lab 3 &bull; CSE Section A</div>
              </div>
              <Badge variant="neutral" size="xs">02:00 - 04:00 PM</Badge>
            </div>
          </div>
        </Card>

        <Card title="Mentees Needing Academic Support" subtitle="Early warning triggers based on SIS attendance & backlogs">
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-ink">Rohan Verma (STU014)</div>
                <div className="text-[11px] text-red-700">Attendance: 68.2% &bull; CGPA: 6.40 (1 Backlog)</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/faculty/mentees')}>
                Counsel
              </Button>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-ink">Priya Nair (STU029)</div>
                <div className="text-[11px] text-amber-800">Placement Standing: Unregistered for Super Dream</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/faculty/mentees')}>
                Inspect
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="My Courses" subtitle="Continuous Internal Evaluation (CIE)">
          <p className="text-xs text-ink-muted mb-4">
            Upload internal assessment scores, monitor class attendance, and manage syllabus progress.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/faculty/courses')}>
            <span>Manage Courses</span>
            <ArrowRight size={13} />
          </Button>
        </Card>

        <Card title="Mentorship Roster" subtitle="One-on-one student advising">
          <p className="text-xs text-ink-muted mb-4">
            Track your 18 assigned mentees, log advising sessions, and sign off on placement NOC forms.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/faculty/mentees')}>
            <span>Open Mentee Roster</span>
            <ArrowRight size={13} />
          </Button>
        </Card>

        <Card title="Approval Queue" subtitle="Pending academic attestations">
          <p className="text-xs text-ink-muted mb-4">
            Verify prerequisite course waivers, attendance condonations, and student leave requests.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/faculty/approvals')}>
            <span>Process Approvals</span>
            <ArrowRight size={13} />
          </Button>
        </Card>
      </div>
    </div>
  );
};

