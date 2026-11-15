import { describe, it, expect } from 'vitest';
import {
  StudentProfileSchema,
  StudentAcademicsSchema,
  StudentConsentSchema,
  PlacementReadinessSchema,
  SkillRecommendationsSchema,
} from '../api';
import { z } from '../../../core/api/parseEdge';

describe('Student Portal Edge Schemas Against Live Payloads', () => {
  it('parses live /api/student/me/ payload for STU001', () => {
    const payload = {
      student_id: 'STU001',
      name: 'Aarav Sharma',
      email: 'aarav1@univ.edu',
      department: 'CSE',
      year: 4,
      cgpa: 8.9,
      backlogs: 0,
      skills: ['Java', 'Spring Boot', 'MySQL'],
      placement_status: 'Unplaced',
      created_at: '2026-07-17T19:55:44Z',
      mentor_id: '11266',
      school: 'School of Computing',
      person_id: 'PER_STU_001',
      mentorship_relations: [
        {
          relation_id: 'REL_STU_MEN_STU001_11266',
          created_at: '2026-11-14T19:55:50.851000Z',
          from_id: 'STU001',
          from_name: 'Aarav Sharma',
          from_type: 'STUDENT',
          metadata: { school: 'School of Computing', department: 'CSE' },
          relation_type: 'MENTORED_BY',
          to_id: '11266',
          to_name: 'Dr. Janpreet Singh',
          to_type: 'FACULTY',
        },
      ],
    };

    const res = StudentProfileSchema.safeParse(payload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe('Aarav Sharma');
      expect(res.data.student_id).toBe('STU001');
      expect(res.data.cgpa).toBe(8.9);
    }
  });

  it('parses live /api/student/academics/ payload with null batch and empty arrays', () => {
    const payload = {
      student_id: 'STU001',
      name: 'Aarav Sharma',
      cgpa: 8.9,
      attendance: 0.0,
      backlogs: 0,
      department: 'CSE',
      year: 4,
      batch: null,
      academic_records: [],
      courses: [],
    };

    const res = StudentAcademicsSchema.safeParse(payload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.student_id).toBe('STU001');
      expect(res.data.batch).toBeUndefined();
    }
  });

  it('parses live /api/student/consents/ array payload', () => {
    const payload = [
      {
        student_id: 'STU001',
        purpose: 'PLACEMENT_MATCHING',
        purpose_title: 'Recruitment Matching & Drive Eligibility',
        status: 'ACTIVE',
        is_mandatory: true,
      },
    ];

    const res = z.array(StudentConsentSchema).safeParse(payload);
    expect(res.success).toBe(true);
  });

  it('parses live /api/student/insights/readiness/ payload', () => {
    const payload = {
      student_id: 'STU001',
      opted_out: false,
      status: 'SUCCESS',
      placement_probability: 0.0,
      placement_probability_ratio: 0.0,
    };

    const res = PlacementReadinessSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it('parses live /api/student/insights/skills/ payload', () => {
    const payload = {
      student_id: 'STU001',
      current_skills: ['java', 'spring boot', 'mysql'],
      recommendations: [{ skill: 'Docker' }],
    };

    const res = SkillRecommendationsSchema.safeParse(payload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.recommendations).toEqual(['Docker']);
    }
  });
});
