/**
 * PlaceFlow / Meridian — Faculty Advising Home (Phase 6).
 *
 * Surfaces "What needs me now" command center, academic verification queue, and scheduled lectures.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button, TaskCard, PersonChip, EmptyState, useDocumentTitle } from '../../../ui';
import { facultyApi } from '../api';

export const FacultyHomePage: React.FC = () => {
  useDocumentTitle('Faculty Advising');
  const { me } = useAuth();
  const navigate = useNavigate();
  const [mentees, setMentees] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    facultyApi
      .getMentees()
      .then((res) => {
        if (active) {
          setMentees(res.students || []);
        }
      })
      .catch(() => {
        if (active) {
          setMentees([]);
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

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title={`Faculty Advising — ${me?.display_name || 'Faculty Member'}`}
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
              title: atRiskMentees.length > 0
                ? `Counsel ${atRiskMentees.length} at-risk mentee(s) regarding academic progression`
                : 'Review academic progress and attendance standing for assigned cohort',
              due: null,
              priority: atRiskMentees.length > 0 ? 'HIGH' : 'MEDIUM',
              icon: AlertTriangle,
              action_label: 'Open Dossier',
            }}
            onAction={() => navigate('/faculty/mentees')}
          />
          <TaskCard
            data={{
              task_id: 'task_approvals',
              title: 'Review pending CIE verification and student leave requests',
              due: null,
              priority: 'MEDIUM',
              icon: CheckSquare,
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
          value={mentees.length}
          hint="Advising Cohort Scope"
          icon={Users}
        />
        <StatCard
          label="Mentees Needing Attention"
          value={atRiskMentees.length}
          hint="Attendance < 75% or Backlogs > 0"
          icon={AlertTriangle}
        />
        <StatCard
          label="Teaching Sections"
          value={2}
          hint="Assigned Course Sections"
          icon={BookOpen}
        />
        <StatCard
          label="Approvals"
          value="Active"
          hint="Departmental Queue"
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

        <Card title="Mentees Needing Academic Support" subtitle="Early warning triggers based on attendance & backlogs">
          {atRiskMentees.length === 0 ? (
            <EmptyState
              title="All Mentees on Track"
              description="All assigned students currently satisfy academic progression and statutory attendance criteria."
            />
          ) : (
            <div className="space-y-3">
              {atRiskMentees.map((m) => {
                const att = m.attendance_percentage ?? m.attendance;
                const dept = m.department || m.dept || 'Engineering';
                return (
                  <div key={m.student_id} className="p-3 rounded-lg border border-red-200 bg-red-50/40 flex items-center justify-between">
                    <div className="space-y-1">
                      <PersonChip
                        name={m.name}
                        role={`${dept} Mentee`}
                        person_id={m.student_id}
                        profileData={{
                          person_id: m.student_id,
                          name: m.name,
                          reg_no: m.student_id,
                          department: dept,
                          cgpa: m.cgpa != null ? Number(m.cgpa) : undefined,
                          roles: ['Student Mentee'],
                          is_verified: true,
                        }}
                        onClick={() => navigate('/faculty/mentees')}
                      />
                      <div className="text-xs text-red-700 pl-1">
                        Attendance: {att != null ? `${att}%` : 'N/A'} &bull; CGPA: {m.cgpa != null ? Number(m.cgpa).toFixed(2) : 'N/A'} ({m.backlogs ?? 0} Backlogs)
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/faculty/mentees')}>
                      Counsel
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
