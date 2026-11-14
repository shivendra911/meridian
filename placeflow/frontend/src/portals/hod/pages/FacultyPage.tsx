/**
 * PlaceFlow / Meridian — HOD Faculty Roster (Phase 6).
 *
 * Read-only departmental faculty roster, teaching loads, and assigned mentee counts.
 * Strictly avoids leaking global IAM administrative controls; uses PersonChip for faculty.
 */

import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Award } from 'lucide-react';
import { PageHeader, StatCard, Card, Badge, PersonChip, EmptyState, Skeleton, useDocumentTitle } from '../../../ui';
import { hodApi } from '../api';

interface FacultyRecord {
  id?: string;
  faculty_id?: string;
  name: string;
  designation?: string;
  department?: string;
  specialization?: string;
  coursesAssigned?: string[];
  menteesCount?: number;
  email?: string;
}

export const HodFacultyPage: React.FC = () => {
  useDocumentTitle('Department Faculty Roster');
  const [faculty, setFaculty] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    hodApi
      .getFaculty()
      .then((res) => {
        if (active) {
          setFaculty(res.faculty || []);
        }
      })
      .catch(() => {
        if (active) {
          setFaculty([]);
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

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Department Faculty Roster"
        description="Department of Computer Science &amp; Engineering faculty directory, assigned teaching loads, and mentorship cohorts."
        badge={<Badge variant="institutional" size="xs">Read-Only Directory</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Teaching Faculty" value={faculty.length} hint="Departmental Staff" icon={Users} />
        <StatCard label="Workload Status" value="Active" hint="Semester Term 2026" icon={BookOpen} />
        <StatCard label="Advising Scope" value="Assigned" hint="Cohort Distribution" icon={Award} />
      </div>

      <Card title="Department Faculty Directory" subtitle="Official faculty profiles and contact details">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : faculty.length === 0 ? (
          <EmptyState
            title="No Faculty Records Found"
            description="No faculty profiles found for this organizational department."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas text-ink-muted uppercase tracking-wider text-xs h-10">
                  <th className="py-2.5 px-4 font-semibold">Faculty ID</th>
                  <th className="py-2.5 px-4 font-semibold">Faculty Name</th>
                  <th className="py-2.5 px-4 font-semibold">Designation</th>
                  <th className="py-2.5 px-4 font-semibold">Department</th>
                  <th className="py-2.5 px-4 font-semibold">Contact Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {faculty.map((f) => {
                  const fid = f.faculty_id || f.id || 'FAC';
                  const designation = f.designation || 'Faculty Member';
                  const dept = f.department || 'Computer Science & Engineering';

                  return (
                    <tr key={fid} className="h-12 hover:bg-canvas/50 transition-colors">
                      <td className="py-2 px-4 font-mono font-bold text-brand">{fid}</td>
                      <td className="py-2 px-4">
                        <PersonChip
                          name={f.name}
                          role={designation}
                          person_id={fid}
                          profileData={{
                            person_id: fid,
                            name: f.name,
                            department: dept,
                            roles: [designation],
                            is_verified: true,
                            email: f.email,
                          }}
                        />
                      </td>
                      <td className="py-2 px-4 text-ink font-medium">{designation}</td>
                      <td className="py-2 px-4 text-ink-muted">{dept}</td>
                      <td className="py-2 px-4 text-ink-muted">{f.email || '—'}</td>
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
