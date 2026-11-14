/**
 * PlaceFlow / Meridian — Faculty Mentee Roster (Phase 6).
 *
 * Scoped advising dashboard for assigned student mentees using PersonChip.
 */

import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatCard, Card, Badge, PersonChip, EmptyState, Skeleton, useDocumentTitle } from '../../../ui';
import { facultyApi } from '../api';

interface MenteeRecord {
  student_id: string;
  name: string;
  department?: string | null;
  dept?: string | null;
  cgpa?: number | null;
  attendance_percentage?: number | null;
  attendance?: number | null;
  backlogs?: number | null;
  placement_status?: string | null;
  risk_level?: 'Low' | 'Moderate' | 'High' | null;
}

export const FacultyMenteesPage: React.FC = () => {
  useDocumentTitle('Student Mentorship Roster');
  const [search, setSearch] = useState('');
  const [mentees, setMentees] = useState<MenteeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
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
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = mentees.filter((m) =>
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.student_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const atRiskCount = mentees.filter((m) => {
    const att = m.attendance_percentage ?? m.attendance;
    return (att != null && att < 75) || (m.backlogs ?? 0) > 0 || (m.cgpa != null && m.cgpa < 6.5);
  }).length;

  const placedCount = mentees.filter((m) =>
    (m.placement_status || '').toLowerCase().includes('placed')
  ).length;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Student Mentorship Roster"
        description="Assigned academic mentees, attendance early warnings, and placement advising logs."
        badge={<Badge variant="institutional" size="xs">Assigned Cohort</Badge>}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Mentees" value={mentees.length} hint="Assigned by HOD" icon={Users} />
        <StatCard label="At-Risk Candidates" value={atRiskCount} hint="Immediate counseling required" icon={AlertCircle} />
        <StatCard label="Placement Confirmed" value={placedCount} hint="Formal offer accepted" icon={CheckCircle2} />
      </div>

      {/* Roster Table */}
      <Card title="Mentee Dossiers & Placement Readiness" subtitle="Real-time academic standing and placement pipeline status">
        <div className="mb-4 flex items-center justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll number..."
            className="px-3 py-1.5 text-xs bg-canvas border border-line rounded-lg text-ink placeholder-ink-muted focus:outline-none focus:border-brand w-72"
          />
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Mentees Found"
            description={search ? 'No candidate records match your search filter.' : 'No mentees have been assigned to your advising cohort.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas text-ink-muted uppercase tracking-wider text-xs h-10">
                  <th className="py-2.5 px-4 font-semibold">Roll Number</th>
                  <th className="py-2.5 px-4 font-semibold">Candidate Name</th>
                  <th className="py-2.5 px-4 font-semibold">CGPA</th>
                  <th className="py-2.5 px-4 font-semibold">Attendance</th>
                  <th className="py-2.5 px-4 font-semibold">Backlogs</th>
                  <th className="py-2.5 px-4 font-semibold">Placement Standing</th>
                  <th className="py-2.5 px-4 font-semibold">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((m) => {
                  const att = m.attendance_percentage ?? m.attendance;
                  const dept = m.department || m.dept || 'Engineering';
                  const isHighRisk = (att != null && att < 75) || (m.backlogs ?? 0) > 0;
                  const riskLabel = m.risk_level || (isHighRisk ? 'High' : 'Low');

                  return (
                    <tr key={m.student_id} className="h-11 hover:bg-canvas/50 transition-colors">
                      <td className="py-2 px-4 font-mono font-bold text-brand">{m.student_id}</td>
                      <td className="py-2 px-4">
                        <PersonChip
                          name={m.name}
                          role={dept}
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
                        />
                      </td>
                      <td className="py-2 px-4 text-ink font-semibold">
                        {m.cgpa != null ? Number(m.cgpa).toFixed(2) : '—'}
                      </td>
                      <td className="py-2 px-4">
                        {att != null ? (
                          <span className={att < 75 ? 'text-red-600 font-bold' : 'text-ink'}>
                            {att}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 px-4 text-ink">{m.backlogs ?? 0}</td>
                      <td className="py-2 px-4 font-medium text-ink">{m.placement_status || 'Eligible'}</td>
                      <td className="py-2 px-4">
                        <Badge
                          variant={riskLabel === 'High' ? 'danger' : riskLabel === 'Moderate' ? 'neutral' : 'success'}
                          size="xs"
                        >
                          {riskLabel} Risk
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
