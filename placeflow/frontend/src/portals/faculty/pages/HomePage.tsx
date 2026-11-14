/**
 * PlaceFlow / Meridian — Faculty Advising Home (Phase 6).
 *
 * Surfaces "What needs me now" command center, academic verification queue, and scheduled lectures.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CheckSquare,
  AlertTriangle} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button, TaskCard, PersonChip, useDocumentTitle } from '../../../ui';

export const FacultyHomePage: React.FC = () => {
  useDocumentTitle('Faculty Advising');
  const { me } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 font-sans">
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

      {/* 1. What Needs Me Now — Actionable TaskCards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          What Needs Me Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskCard
            data={{
              task_id: 'task_counsel',
              title: 'Counsel at-risk mentee Rohan Verma (Attendance 68.2%)',
              due: new Date(Date.now() + 24 * 3600 * 1000),
              priority: 'HIGH',
              icon: AlertTriangle,
              action_label: 'Open Dossier',
            }}
            onAction={() => navigate('/faculty/mentees')}
          />
          <TaskCard
            data={{
              task_id: 'task_approvals',
              title: 'Approve 4 pending CIE verification & leave requests',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 2),
              priority: 'HIGH',
              icon: CheckSquare,
              action_label: 'Review Queue',
            }}
            onAction={() => navigate('/faculty/approvals')}
          />
          <TaskCard
            data={{
              task_id: 'task_curriculum',
              title: 'Update CS301 mid-term outcome mapping & syllabus',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 4),
              priority: 'MEDIUM',
              icon: BookOpen,
              action_label: 'View Course',
            }}
            onAction={() => navigate('/faculty/courses')}
          />
        </div>
      </div>

      {/* 2. KPI Row */}
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

      {/* 3. Today's Schedule & At-Risk Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Today's Teaching Schedule" subtitle="Scheduled timetable lectures and laboratory sessions">
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-line bg-canvas flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-ink">CS301: Distributed Operating Systems</div>
                <div className="text-xs text-ink-muted">Room LH-204 &bull; CSE Section B</div>
              </div>
              <Badge variant="institutional" size="xs">10:00 - 11:30 AM</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-line bg-canvas flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-ink">CS405: Cloud &amp; Distributed Systems Lab</div>
                <div className="text-xs text-ink-muted">Computing Lab 3 &bull; CSE Section A</div>
              </div>
              <Badge variant="neutral" size="xs">02:00 - 04:00 PM</Badge>
            </div>
          </div>
        </Card>

        <Card title="Mentees Needing Academic Support" subtitle="Early warning triggers based on SIS attendance & backlogs">
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/40 flex items-center justify-between">
              <div className="space-y-1">
                <PersonChip
                  name="Rohan Verma"
                  role="CSE Mentee"
                  person_id="STU014"
                  profileData={{
                    person_id: 'STU014',
                    name: 'Rohan Verma',
                    reg_no: 'STU014',
                    department: 'CSE',
                    cgpa: 6.40,
                    roles: ['Student Mentee'],
                    is_verified: true,
                  }}
                  onClick={() => navigate('/faculty/mentees')}
                />
                <div className="text-xs text-red-700 pl-1">Attendance: 68.2% &bull; CGPA: 6.40 (1 Backlog)</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/faculty/mentees')}>
                Counsel
              </Button>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 flex items-center justify-between">
              <div className="space-y-1">
                <PersonChip
                  name="Priya Nair"
                  role="CSE Mentee"
                  person_id="STU029"
                  profileData={{
                    person_id: 'STU029',
                    name: 'Priya Nair',
                    reg_no: 'STU029',
                    department: 'CSE',
                    cgpa: 7.45,
                    roles: ['Student Mentee'],
                    is_verified: true,
                  }}
                  onClick={() => navigate('/faculty/mentees')}
                />
                <div className="text-xs text-amber-800 pl-1">Placement Standing: Unregistered for Super Dream</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/faculty/mentees')}>
                Inspect
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
