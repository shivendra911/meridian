import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DriveRoomPage } from '../pages/DriveRoomPage';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    getJobs: vi.fn(),
    getApplications: vi.fn(),
    getInterviews: vi.fn(),
    getPlacements: vi.fn(),
    getStudents: vi.fn(),
    updateApplicationStatus: vi.fn(),
    resolveSuperdayConflicts: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'JOB-001' }),
    useNavigate: () => vi.fn(),
  };
});

describe('DriveRoomPage — Journey System Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (api.getJobs as any).mockResolvedValue({
      count: 1,
      jobs: [
        {
          job_id: 'JOB-001',
          title: 'Software Engineer',
          company_id: 'COMP-001',
          tier: 'Super Dream',
          package_lpa: 18,
          vacancies: 5,
          filled: 1,
          status: 'PUBLISHED',
          eligibility: {
            min_cgpa: 7.5,
            max_backlogs: 0,
            departments: ['CSE', 'IT'],
          },
        },
      ],
    });

    (api.getApplications as any).mockResolvedValue({
      count: 2,
      applications: [
        {
          application_id: 'APP-001',
          job_id: 'JOB-001',
          student_id: 'STU-001',
          student_name: 'Test Candidate Alpha',
          status: 'Applied',
        },
        {
          application_id: 'APP-002',
          job_id: 'JOB-001',
          student_id: 'STU-002',
          student_name: 'Test Candidate Beta',
          status: 'Shortlisted',
        },
      ],
    });

    (api.getInterviews as any).mockResolvedValue({
      count: 1,
      interviews: [
        {
          interview_id: 'INT-001',
          application_id: 'APP-002',
          student_id: 'STU-002',
          round: 'Technical Round 1',
          mode: 'Offline',
          venue: 'Seminar Hall A',
          result: 'Scheduled',
        },
      ],
    });

    (api.getPlacements as any).mockResolvedValue({
      count: 0,
      placements: [],
    });

    (api.getStudents as any).mockResolvedValue({
      count: 3,
      students: [
        {
          student_id: 'STU-001',
          name: 'Test Candidate Alpha',
          email: 'alpha@univ.edu',
          department: 'CSE',
          year: 4,
          cgpa: 8.8,
          backlogs: 0,
          skills: ['Java', 'Python'],
          placement_status: 'Unplaced',
        },
        {
          student_id: 'STU-002',
          name: 'Test Candidate Beta',
          email: 'beta@univ.edu',
          department: 'IT',
          year: 4,
          cgpa: 7.8,
          backlogs: 0,
          skills: ['React'],
          placement_status: 'Unplaced',
        },
        {
          student_id: 'STU-003',
          name: 'Test Candidate Gamma',
          email: 'gamma@univ.edu',
          department: 'MECH',
          year: 4,
          cgpa: 6.2,
          backlogs: 2,
          skills: ['CAD'],
          placement_status: 'Unplaced',
        },
      ],
    });
  });

  it('renders Drive Room with Live Eligibility Engine, Pipeline Board, and Receipts', async () => {
    render(
      <MemoryRouter>
        <DriveRoomPage />
      </MemoryRouter>
    );

    // Header & Company info
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeDefined();
    });
    expect(screen.getByText(/₹18 LPA/i)).toBeDefined();

    // Live Eligibility Engine counter (2 eligible out of 3 students)
    expect(screen.getByText('Eligibility Rules')).toBeDefined();
    expect(screen.getByTestId('live-eligible-count').textContent).toBe('2');
    expect(screen.getByText(/of 3 students/i)).toBeDefined();

    // Recruitment Pipeline Board
    expect(screen.getByText('Recruitment Pipeline')).toBeDefined();
    expect(screen.getByText('Test Candidate Alpha')).toBeDefined();
    expect(screen.getByText('Test Candidate Beta')).toBeDefined();

    // Drive Activity Receipts
    expect(screen.getByText('Drive Activity Receipts')).toBeDefined();
    expect(screen.getByText('Job Notification Form (JNF)')).toBeDefined();
  });

  it('updates live eligible count when CGPA slider changes', async () => {
    render(
      <MemoryRouter>
        <DriveRoomPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeDefined();
    });

    const cgpaSlider = screen.getByLabelText(/Minimum CGPA Cutoff/i);
    // Change CGPA cutoff to 8.5 -> only STU-001 (8.8) is eligible
    fireEvent.change(cgpaSlider, { target: { value: '8.5' } });

    await waitFor(() => {
      expect(screen.getByTestId('live-eligible-count').textContent).toBe('1');
    });
  });
});
