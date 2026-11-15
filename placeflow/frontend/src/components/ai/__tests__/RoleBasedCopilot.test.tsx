import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CampusCopilotDrawer } from '../CampusCopilotDrawer';
import { client } from '../../../core/api/client';

let mockAuthUser = {
  account_id: 'acc_student_001',
  person_id: 'per_student_001',
  subject: { type: 'student', id: 'STU_AARAV_001' },
  display_name: 'Aarav Sharma',
  default_portal: 'student',
  profile: {
    display_name: 'Aarav Sharma',
    department: 'Computer Science & Engineering',
    institution_name: 'Apex Institute of Technology',
  },
  assignments: [{ role_code: 'STUDENT_MEMBER' }],
};

vi.mock('../../../core/auth/useAuth', () => ({
  useAuth: () => ({
    me: mockAuthUser,
  }),
}));

vi.mock('../../../core/api/client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Role-Based & User-Specific Copilot Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = {
      account_id: 'acc_student_001',
      person_id: 'per_student_001',
      subject: { type: 'student', id: 'STU_AARAV_001' },
      display_name: 'Aarav Sharma',
      default_portal: 'student',
      profile: {
        display_name: 'Aarav Sharma',
        department: 'Computer Science & Engineering',
        institution_name: 'Apex Institute of Technology',
      },
      assignments: [{ role_code: 'STUDENT_MEMBER' }],
    };
  });

  it('renders student-specific persona, user subtitle, and candidate quick queries', () => {
    render(<CampusCopilotDrawer isOpen={true} onClose={vi.fn()} portal="student" />);

    // User-specific identity header
    expect(screen.getByText('Campus AI Copilot')).toBeTruthy();
    expect(screen.getAllByText(/Candidate Career Copilot/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Student Member')).toBeTruthy();
    expect(screen.getAllByText(/Aarav Sharma/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Computer Science & Engineering/i).length).toBeGreaterThanOrEqual(1);

    // Student-tailored starter prompt queries
    expect(screen.getByText(/Suggested Student Member Queries/i)).toBeTruthy();
    expect(screen.getByText(/Am I eligible for upcoming Tier-1 Super Dream drives/i)).toBeTruthy();
    expect(screen.getByText(/Check my NEP 2020 completed credits for graduation/i)).toBeTruthy();

    // Student profile snapshot card
    expect(screen.getByText(/Current CGPA/i)).toBeTruthy();
    expect(screen.getByText(/Active Drives/i)).toBeTruthy();
    expect(screen.getByText(/NEP Credits/i)).toBeTruthy();
  });

  it('restricts autonomous agents to student-authorized tools (Academic Advisor & Superday)', () => {
    render(<CampusCopilotDrawer isOpen={true} onClose={vi.fn()} portal="student" />);
    fireEvent.click(screen.getByText('Autonomous Agents'));

    expect(screen.getAllByText(/Academic Advisor/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Superday Solver/i).length).toBeGreaterThanOrEqual(1);

    // Should NOT show Admin/Management/TPO-only agents like NIRF or JNF
    expect(screen.queryByText(/NIRF Audit/i)).toBeNull();
    expect(screen.queryByText(/JNF Intelligence/i)).toBeNull();

    // Form should pre-populate with student's specific ID
    const studentInput = screen.getByDisplayValue('STU_AARAV_001');
    expect(studentInput).toBeTruthy();
  });

  it('switches persona lens dynamically and updates starter queries and authorized tools', () => {
    render(<CampusCopilotDrawer isOpen={true} onClose={vi.fn()} portal="student" />);

    // Open lens switcher dropdown
    const lensBtn = screen.getByTitle('Switch Persona Lens');
    fireEvent.click(lensBtn);

    // Switch to TPO lens
    const tpoOption = screen.getByText('tpo');
    fireEvent.click(tpoOption);

    // Verify TPO persona is active
    expect(screen.getAllByText(/Placement Operations Copilot/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Placement Officer')).toBeTruthy();
    expect(screen.getByText(/Suggested Placement Officer Queries/i)).toBeTruthy();
    expect(screen.getByText(/Classify Microsoft JNF/i)).toBeTruthy();
  });

  it('executes role-scoped copilot query via /copilot/query/', async () => {
    (client.post as any).mockResolvedValueOnce({
      answer: 'Aarav, as a CSE student with 135 credits, you are eligible for Tier-1 Super Dream drives.',
      groundedness_score: 0.96,
      trace_id: 'trace_copilot_stu_001',
      total_tokens: 180,
      citations: [
        {
          doc_title: 'Placement Entitlement Bylaws',
          version: '2026.1',
          section_heading: 'Super Dream Eligibility Criteria',
          source_authority: 'Placement Board',
        },
      ],
      suggested_followups: ['Check my interview conflicts', 'Review DPDP consent status'],
    });

    render(<CampusCopilotDrawer isOpen={true} onClose={vi.fn()} portal="student" />);
    const input = screen.getByPlaceholderText(/Ask about placement policy/i);
    fireEvent.change(input, { target: { value: 'Am I eligible for Google?' } });

    const submitBtn = screen.getByText('Ask Copilot');
    fireEvent.click(submitBtn);

    expect(client.post).toHaveBeenCalledWith(
      '/copilot/query/',
      expect.objectContaining({
        query: 'Am I eligible for Google?',
        lens: 'student',
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Aarav, as a CSE student with 135 credits/i)).toBeTruthy();
      expect(screen.getByText('Groundedness: 96%')).toBeTruthy();
      expect(screen.getByText(/Super Dream Eligibility Criteria/i)).toBeTruthy();
      expect(screen.getByText('Check my interview conflicts')).toBeTruthy();
    });
  });
});
