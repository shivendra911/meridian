/**
 * PlaceFlow / Meridian — HOD Faculty Roster (Phase 6).
 *
 * Read-only departmental faculty roster, teaching loads, and assigned mentee counts.
 * Strictly avoids leaking global IAM administrative controls.
 */

import React from 'react';
import { Users, BookOpen, Mail, Phone, Award } from 'lucide-react';
import { PageHeader, StatCard, Card, Badge } from '../../../ui';

interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  specialization: string;
  coursesAssigned: string[];
  menteesCount: number;
  email: string;
}

const CSE_FACULTY: FacultyMember[] = [
  {
    id: 'FAC-11266',
    name: 'Dr. Janpreet Singh',
    designation: 'Associate Professor',
    specialization: 'Distributed Systems & Cloud Computing',
    coursesAssigned: ['CS301 (Distributed OS)', 'CS405 (Cloud Lab)'],
    menteesCount: 18,
    email: 'janpreet.singh@univ.edu',
  },
  {
    id: 'FAC-35422',
    name: 'Prof. Swathy Reghu',
    designation: 'Assistant Professor',
    specialization: 'Artificial Intelligence & Machine Learning',
    coursesAssigned: ['CS401 (AI Ethics)', 'CS202 (Data Structures)'],
    menteesCount: 16,
    email: 'swathy.reghu@univ.edu',
  },
  {
    id: 'FAC-10023',
    name: 'Dr. Rajesh Khanna',
    designation: 'Professor',
    specialization: 'Database Systems & Information Retrieval',
    coursesAssigned: ['CS204 (DBMS)', 'CS508 (Big Data Analytics)'],
    menteesCount: 20,
    email: 'rajesh.khanna@univ.edu',
  },
];

export const HodFacultyPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Department Faculty Roster"
        description="Department of Computer Science & Engineering faculty directory, assigned teaching loads, and mentorship cohorts."
        badge={<Badge variant="institutional" size="xs">Read-Only Directory</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Teaching Faculty" value={CSE_FACULTY.length} hint="Full-time departmental staff" icon={Users} />
        <StatCard label="Average Workload" value="14.2 hrs" hint="Weekly classroom contact" icon={BookOpen} />
        <StatCard label="Active Mentorships" value={54} hint="Students currently advised" icon={Award} />
      </div>

      <Card title="Department Faculty Directory" subtitle="Official faculty profiles and contact details">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-canvas text-ink-muted uppercase tracking-wider text-[11px] h-10">
                <th className="py-2.5 px-4 font-semibold">Faculty ID</th>
                <th className="py-2.5 px-4 font-semibold">Faculty Name</th>
                <th className="py-2.5 px-4 font-semibold">Designation</th>
                <th className="py-2.5 px-4 font-semibold">Specialization</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Courses</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Mentees</th>
                <th className="py-2.5 px-4 font-semibold">Contact Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {CSE_FACULTY.map((f) => (
                <tr key={f.id} className="h-12 hover:bg-canvas/50 transition-colors">
                  <td className="py-2 px-4 font-mono font-bold text-brand">{f.id}</td>
                  <td className="py-2 px-4 font-semibold text-ink">{f.name}</td>
                  <td className="py-2 px-4 text-ink-muted">{f.designation}</td>
                  <td className="py-2 px-4 text-ink">{f.specialization}</td>
                  <td className="py-2 px-4">
                    <div className="flex flex-wrap gap-1">
                      {f.coursesAssigned.map((c, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-canvas border border-line text-[10px] font-mono">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-4 font-mono font-semibold text-brand">{f.menteesCount}</td>
                  <td className="py-2 px-4 text-ink-muted font-mono">{f.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

