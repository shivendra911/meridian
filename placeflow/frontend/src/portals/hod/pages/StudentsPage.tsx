/**
 * PlaceFlow / Meridian — HOD Department Students Roster (Phase 6).
 *
 * Scoped strictly to students belonging to the HOD's organizational unit.
 */

import React, { useState } from 'react';
import { Users, AlertCircle, Award} from 'lucide-react';
import { PageHeader, StatCard, Card, Badge} from '../../../ui';

interface StudentRow {
  id: string;
  name: string;
  cgpa: number;
  attendance: number;
  backlogs: number;
  placementStatus: string;
  mentor: string;
}

const CSE_STUDENTS: StudentRow[] = [
  { id: 'STU001', name: 'Aarav Sharma', cgpa: 8.65, attendance: 89.4, backlogs: 0, placementStatus: 'Placed (Accenture)', mentor: 'Dr. Janpreet Singh' },
  { id: 'STU002', name: 'Diya Patel', cgpa: 8.92, attendance: 92.1, backlogs: 0, placementStatus: 'Shortlisted (Google)', mentor: 'Dr. Janpreet Singh' },
  { id: 'STU014', name: 'Rohan Verma', cgpa: 6.40, attendance: 68.2, backlogs: 1, placementStatus: 'Unplaced (Eligible Regular)', mentor: 'Dr. Janpreet Singh' },
  { id: 'STU029', name: 'Priya Nair', cgpa: 7.45, attendance: 78.5, backlogs: 0, placementStatus: 'Applied (TCS, Infosys)', mentor: 'Prof. Swathy Reghu' },
  { id: 'STU045', name: 'Karan Mehta', cgpa: 7.10, attendance: 81.0, backlogs: 0, placementStatus: 'Placed (Wipro)', mentor: 'Prof. Swathy Reghu' },
];

export const HodStudentsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = CSE_STUDENTS.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Department Student Cohort"
        description="Comprehensive academic performance and placement tracking for Computer Science & Engineering."
        badge={<Badge variant="institutional" size="xs">CSE Department Scope</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Department Intake" value={CSE_STUDENTS.length} hint="Graduating Batch 2025" icon={Users} />
        <StatCard label="Placed Candidates" value={2} hint="Formal acceptances recorded" icon={Award} />
        <StatCard label="Attendance Shortage" value={1} hint="Under 75% statutory criteria" icon={AlertCircle} />
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
              {filtered.map((s) => (
                <tr key={s.id} className="h-11 hover:bg-canvas/50 transition-colors">
                  <td className="py-2 px-4 font-mono font-bold text-brand">{s.id}</td>
                  <td className="py-2 px-4 font-medium text-ink">{s.name}</td>
                  <td className="py-2 px-4 font-mono font-semibold text-ink">{s.cgpa.toFixed(2)}</td>
                  <td className="py-2 px-4 font-mono">
                    <span className={s.attendance < 75 ? 'text-red-600 font-bold' : 'text-ink'}>
                      {s.attendance}%
                    </span>
                  </td>
                  <td className="py-2 px-4 font-mono text-ink">{s.backlogs}</td>
                  <td className="py-2 px-4 font-medium text-ink">{s.placementStatus}</td>
                  <td className="py-2 px-4 text-ink-muted">{s.mentor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

