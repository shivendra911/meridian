/**
 * PlaceFlow / Meridian — Faculty Teaching Courses (Phase 6).
 *
 * Dedicated faculty teaching management: course delivery, enrollments, and CIE gradebook.
 */

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, Card, Badge, Button} from '../../../ui';

interface CourseOffering {
  code: string;
  title: string;
  credits: number;
  section: string;
  enrolled: number;
  attendanceAvg: number;
  syllabusProgress: number;
}

const FACULTY_COURSES: CourseOffering[] = [
  {
    code: 'CS301',
    title: 'Distributed Operating Systems',
    credits: 4,
    section: 'CSE-B',
    enrolled: 62,
    attendanceAvg: 84.5,
    syllabusProgress: 75,
  },
  {
    code: 'CS405',
    title: 'Cloud & Distributed Systems Lab',
    credits: 2,
    section: 'CSE-A',
    enrolled: 30,
    attendanceAvg: 91.2,
    syllabusProgress: 85,
  },
];

export const FacultyCoursesPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<CourseOffering>(FACULTY_COURSES[0]);

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Teaching &amp; Course Delivery"
        description="Assigned semester courses, student section rosters, and Continuous Internal Evaluation (CIE)."
        badge={<Badge variant="institutional" size="xs">Active Term</Badge>}
      />

      {/* Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FACULTY_COURSES.map((course) => (
          <div
            key={course.code}
            onClick={() => setSelectedCourse(course)}
            className={`p-5 rounded-xl border bg-surface cursor-pointer transition-all ${
              selectedCourse.code === course.code
                ? 'border-brand ring-1 ring-brand shadow-xs'
                : 'border-line hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="font-mono text-xs font-bold text-brand">{course.code}</span>
                <h3 className="text-sm font-bold text-ink">{course.title}</h3>
              </div>
              <Badge variant="neutral" size="xs">{course.section}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-line my-3 text-xs">
              <div>
                <span className="text-xs text-ink-muted uppercase block">Enrolled</span>
                <span className="font-semibold text-ink font-mono">{course.enrolled}</span>
              </div>
              <div>
                <span className="text-xs text-ink-muted uppercase block">Avg Attend.</span>
                <span className="font-semibold text-success font-mono">{course.attendanceAvg}%</span>
              </div>
              <div>
                <span className="text-xs text-ink-muted uppercase block">Progress</span>
                <span className="font-semibold text-brand font-mono">{course.syllabusProgress}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>{course.credits} Credits</span>
              <span className="text-brand font-medium">Select Section &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Course Gradebook & Roster */}
      <Card
        title={`${selectedCourse.code} — Internal Assessment Gradebook (${selectedCourse.section})`}
        subtitle="Record test scores and verify exam eligibility"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-canvas text-ink-muted uppercase tracking-wider text-xs h-10">
                <th className="py-2.5 px-4 font-semibold">Roll Number</th>
                <th className="py-2.5 px-4 font-semibold">Student Name</th>
                <th className="py-2.5 px-4 font-semibold">Attendance</th>
                <th className="py-2.5 px-4 font-semibold">Quiz 1 (10)</th>
                <th className="py-2.5 px-4 font-semibold">Mid-Term (30)</th>
                <th className="py-2.5 px-4 font-semibold">CIE Total (50)</th>
                <th className="py-2.5 px-4 font-semibold">Exam Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                { id: 'STU001', name: 'Aarav Sharma', att: 89.4, q: 9, m: 27, cie: 45, ok: true },
                { id: 'STU002', name: 'Diya Patel', att: 92.1, q: 10, m: 28, cie: 47, ok: true },
                { id: 'STU014', name: 'Rohan Verma', att: 68.2, q: 6, m: 18, cie: 30, ok: false },
                { id: 'STU029', name: 'Priya Nair', att: 78.5, q: 8, m: 24, cie: 40, ok: true },
              ].map((row) => (
                <tr key={row.id} className="h-11 hover:bg-canvas/50 transition-colors">
                  <td className="py-2 px-4 font-mono font-semibold text-brand">{row.id}</td>
                  <td className="py-2 px-4 font-medium text-ink">{row.name}</td>
                  <td className="py-2 px-4 font-mono">
                    <span className={row.att < 75 ? 'text-red-600 font-bold' : 'text-ink'}>
                      {row.att}%
                    </span>
                  </td>
                  <td className="py-2 px-4 font-mono text-ink">{row.q}</td>
                  <td className="py-2 px-4 font-mono text-ink">{row.m}</td>
                  <td className="py-2 px-4 font-mono font-bold text-ink">{row.cie}</td>
                  <td className="py-2 px-4">
                    <Badge variant={row.ok ? 'success' : 'danger'} size="xs">
                      {row.ok ? 'Eligible' : 'Attendance Shortage'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.success('Gradebook updates saved to campus SIS.')}
            leftIcon={<Save size={14} />}
          >
            Save Internal Marks
          </Button>
        </div>
      </Card>
    </div>
  );
};

