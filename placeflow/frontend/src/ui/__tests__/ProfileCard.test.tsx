import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileCard } from '../cards/ProfileCard';

describe('ProfileCard Component', () => {
  const mockStudent = {
    person_id: 'per_001',
    name: 'Aarav Sharma',
    avatar_url: null,
    headline: 'B.Tech CSE Student',
    department: 'Computer Science',
    roles: ['Student Candidate'],
    is_verified: true,
    reg_no: '2023CSB001',
    cgpa: 8.45,
    email: 'aarav@meridian.edu',
    phone: '+91 98765 43210',
    hidden: [],
    masked: false,
  };

  it('renders default profile data with name, reg no and visible CGPA', () => {
    render(<ProfileCard data={mockStudent} />);

    expect(screen.getByText('Aarav Sharma')).toBeDefined();
    expect(screen.getByText('2023CSB001')).toBeDefined();
    expect(screen.getByText('8.45')).toBeDefined();
    expect(screen.getByText('Verified')).toBeDefined();
    expect(screen.queryByTestId('profile-card-masked-chip')).toBeNull();
  });

  it('renders masked state hiding restricted fields and displaying masked chip', () => {
    const maskedStudent = {
      ...mockStudent,
      masked: true,
      hidden: ['Phone', 'Email', 'CGPA'],
    };

    render(<ProfileCard data={maskedStudent} masked={true} />);

    // Name and official reg no are still verified and visible
    expect(screen.getByText('Aarav Sharma')).toBeDefined();
    expect(screen.getByText('2023CSB001')).toBeDefined();

    // CGPA is hidden from DOM
    expect(screen.queryByText('8.45')).toBeNull();

    // Masked chip is displayed explicitly
    const maskedChip = screen.getByTestId('profile-card-masked-chip');
    expect(maskedChip).toBeDefined();
    expect(maskedChip.textContent).toContain('Hidden for your role: Phone, Email, CGPA');
  });

  it('renders loading skeleton when loading prop is true', () => {
    const { container } = render(<ProfileCard loading={true} />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('renders error state with retry button', () => {
    const onRetry = vi.fn();
    render(<ProfileCard error="Failed to fetch person card" onRetry={onRetry} />);

    expect(screen.getByText('Failed to load content')).toBeDefined();
    expect(screen.getByText('Failed to fetch person card')).toBeDefined();
    expect(screen.getByText('Try again')).toBeDefined();
  });
});
