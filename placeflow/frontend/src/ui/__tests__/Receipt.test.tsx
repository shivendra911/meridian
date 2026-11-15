import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Receipt, ReceiptLine } from '../Receipt';

describe('Receipt Component', () => {
  const mockLines: ReceiptLine[] = [
    { label: 'CGPA Check', value: '8.45 >= 7.0', status: 'pass' },
    { label: 'Backlogs Check', value: '0 Backlogs', status: 'pass' },
    { label: 'Interview Slot Assigned', value: 'Seminar Hall A', status: 'info' },
  ];

  it('renders title and all receipt lines with values', () => {
    render(<Receipt title="Application Verified" lines={mockLines} timestamp="10:30 AM" />);

    expect(screen.getByText('Application Verified')).toBeDefined();
    expect(screen.getByText('CGPA Check')).toBeDefined();
    expect(screen.getByText('8.45 >= 7.0')).toBeDefined();
    expect(screen.getByText('10:30 AM')).toBeDefined();
  });

  it('renders pass status with accessible label', () => {
    render(<Receipt title="Work Receipt" lines={mockLines} />);

    const passedIcons = screen.getAllByLabelText('Passed');
    expect(passedIcons.length).toBe(2);
  });
});
