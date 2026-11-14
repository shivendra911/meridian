/**
 * PlaceFlow / Meridian — HOD Department Students Roster (Phase 6).
 *
 * Scoped strictly to students belonging to the HOD's organizational unit.
 */

import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Award } from 'lucide-react';
import { PageHeader, StatCard, Card, Badge, EmptyState, Skeleton, useDocumentTitle } from '../../../ui';
import { hodApi } from '../api';

interface StudentRecord {
  student_id: string;
  name: string;
  cgpa?: number | null;
  attendance_percentage?: number | null;
  attendance?: number | null;
  backlogs?: number | null;
  placement_status?: string | null;
  mentor_name?: string | null;
  mentor?: string | null;
}

export const HodStudentsPage: React.FC = () => {
  useDocumentTitle('Department Students Roster');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
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

  const filtered = students.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.student_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const placedCount = students.filter((s) => (s.placement_status || '').toLowerCase().includes('placed')).length;
  const shortageCount = students.filter((s) => {
    const att = s.attendance_percentage ?? s.attendance;
    return att != null && att < 75;
  }).length;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Department Student Cohort"
        description="Comprehensive academic performance and placement tracking for Computer Science & Engineering."
        badge={<Badge variant="institutional" size="xs">CSE Department Scope</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Department Intake" value={students.length} hint="Assigned Department Cohort" icon={Users} />
        <StatCard label="Placed Candidates" value={placedCount} hint="Formal acceptances recorded" icon={Award} />
        <StatCard label="Attendance Shortage" value={shortageCount} hint="Under 75% statutory criteria" icon={AlertCircle} />
      </div>

      <Card title="CSE Student Registry" subtitle="Attested academic records and mentorship allocation">
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name or roll number..."
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
            title="No Students Found"
            description={search ? 'No candidate records match your search filter.' : 'No students found in this department cohort.'}
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
                  <th className="py-2.5 px-4 font-semibold">Faculty Mentor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((s) => {
                  const att = s.attendance_percentage ?? s.attendance;
                  return (
                    <tr key={s.student_id} className="h-11 hover:bg-canvas/50 transition-colors">
                      <td className="py-2 px-4 font-mono font-bold text-brand">{s.student_id}</td>
                      <td className="py-2 px-4 font-medium text-ink">{s.name}</td>
                      <td className="py-2 px-4 font-semibold text-ink">
                        {s.cgpa != null ? Number(s.cgpa).toFixed(2) : '—'}
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
                      <td className="py-2 px-4 text-ink">{s.backlogs ?? 0}</td>
                      <td className="py-2 px-4 font-medium text-ink">{s.placement_status || 'Eligible'}</td>
                      <td className="py-2 px-4 text-ink-muted">{s.mentor_name || s.mentor || 'Assigned Mentor'}</td>
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
