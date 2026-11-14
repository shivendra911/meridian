/**
 * PlaceFlow / Meridian — Faculty Teaching Courses (Phase 6).
 *
 * Dedicated faculty teaching management: course delivery, enrollments, and CIE gradebook.
 */

import React, { useState } from 'react';
import { PageHeader, Card, Badge, EmptyState, useDocumentTitle } from '../../../ui';

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
  useDocumentTitle('Teaching & Course Delivery');
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
                <span className="font-semibold text-ink">{course.enrolled}</span>
              </div>
              <div>
                <span className="text-xs text-ink-muted uppercase block">Avg Attend.</span>
                <span className="font-semibold text-success">{course.attendanceAvg}%</span>
              </div>
              <div>
                <span className="text-xs text-ink-muted uppercase block">Progress</span>
                <span className="font-semibold text-brand">{course.syllabusProgress}%</span>
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
        subtitle="Continuous internal evaluation and examination eligibility"
      >
        <EmptyState
          title="Not available yet"
          description="Continuous assessment gradebook and SIS section rosters will appear once connected to the academic grading module."
        />
      </Card>
    </div>
  );
};
