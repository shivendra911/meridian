/**
 * PlaceFlow / Meridian — Faculty Mentee Roster (Phase 6).
 *
 * Scoped advising dashboard for assigned student mentees using PersonChip.
 */

import React, { useState } from 'react';
import { Users, AlertCircle, CheckCircle2, MessageSquare} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatCard, Card, Badge, Button, PersonChip, useDocumentTitle } from '../../../ui';

interface Mentee {
  id: string;
  name: string;
  dept: string;
  cgpa: number;
  attendance: number;
  backlogs: number;
  placementStatus: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
}

const DEMO_MENTEES: Mentee[] = [
  { id: '2023CSB001', name: 'Aarav Sharma', dept: 'CSE', cgpa: 8.65, attendance: 89.4, backlogs: 0, placementStatus: 'Placed (Super Dream)', riskLevel: 'Low' },
  { id: '2023CSB002', name: 'Diya Patel', dept: 'CSE', cgpa: 8.92, attendance: 92.1, backlogs: 0, placementStatus: 'Interview Scheduled', riskLevel: 'Low' },
  { id: '2023CSB014', name: 'Rohan Verma', dept: 'CSE', cgpa: 6.40, attendance: 68.2, backlogs: 1, placementStatus: 'Eligible (Regular)', riskLevel: 'High' },
  { id: '2023CSB029', name: 'Priya Nair', dept: 'CSE', cgpa: 7.45, attendance: 78.5, backlogs: 0, placementStatus: 'Applied (2 drives)', riskLevel: 'Moderate' },
  { id: '2023CSB045', name: 'Karan Mehta', dept: 'CSE', cgpa: 7.10, attendance: 81.0, backlogs: 0, placementStatus: 'Eligible', riskLevel: 'Low' },
];

export const FacultyMenteesPage: React.FC = () => {
  useDocumentTitle('Student Mentorship Roster');
  const [search, setSearch] = useState('');
  const [mentees, _setMentees] = useState<Mentee[]>(DEMO_MENTEES);

  const filtered = mentees.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase())
  );

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
        <StatCard label="At-Risk Candidates" value={1} hint="Immediate counseling required" icon={AlertCircle} />
        <StatCard label="Placement Confirmed" value={1} hint="Formal offer accepted" icon={CheckCircle2} />
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
                <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((m) => (
                <tr key={m.id} className="h-11 hover:bg-canvas/50 transition-colors">
                  <td className="py-2 px-4 font-mono font-bold text-brand">{m.id}</td>
                  <td className="py-2 px-4">
                    <PersonChip
                      name={m.name}
                      role={m.dept}
                      person_id={m.id}
                      profileData={{
                        person_id: m.id,
                        name: m.name,
                        reg_no: m.id,
                        department: m.dept,
                        cgpa: m.cgpa,
                        roles: ['Student Mentee'],
                        is_verified: true,
                      }}
                    />
                  </td>
                  <td className="py-2 px-4 font-mono text-ink font-semibold">{m.cgpa.toFixed(2)}</td>
                  <td className="py-2 px-4 font-mono">
                    <span className={m.attendance < 75 ? 'text-red-600 font-bold' : 'text-ink'}>
                      {m.attendance}%
                    </span>
                  </td>
                  <td className="py-2 px-4 font-mono text-ink">{m.backlogs}</td>
                  <td className="py-2 px-4 font-medium text-ink">{m.placementStatus}</td>
                  <td className="py-2 px-4">
                    <Badge variant={m.riskLevel === 'High' ? 'danger' : m.riskLevel === 'Moderate' ? 'institutional' : 'success'} size="xs">
                      {m.riskLevel} Risk
                    </Badge>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.success(`Advising session note initiated for ${m.name}.`)}
                      leftIcon={<MessageSquare size={13} />}
                    >
                      Counsel
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
