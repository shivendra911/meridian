import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Spine, SpineStage } from '../Spine';

describe('Spine Component', () => {
  const mockStages: SpineStage[] = [
    { id: 'eligible', label: 'Eligible', status: 'completed' },
    { id: 'applied', label: 'Applied', status: 'completed' },
    { id: 'interview', label: 'Interview', status: 'current', date: 'Tomorrow, 10:00' },
    { id: 'offer', label: 'Offer', status: 'upcoming' },
    { id: 'joined', label: 'Joined', status: 'upcoming' },
  ];

  it('renders all stages in the journey', () => {
    render(<Spine stages={mockStages} />);

    expect(screen.getByText('Eligible')).toBeDefined();
    expect(screen.getByText('Applied')).toBeDefined();
    expect(screen.getByText('Interview')).toBeDefined();
    expect(screen.getByText('Offer')).toBeDefined();
    expect(screen.getByText('Joined')).toBeDefined();
    expect(screen.getByText('Tomorrow, 10:00')).toBeDefined();
  });

  it('marks current stage with aria-current="step"', () => {
    render(<Spine stages={mockStages} />);

    const currentItem = screen.getByText('Interview').closest('li');
    expect(currentItem?.getAttribute('aria-current')).toBe('step');

    const completedItem = screen.getByText('Eligible').closest('li');
    expect(completedItem?.getAttribute('aria-current')).toBeNull();
  });

  it('triggers onStageClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Spine stages={mockStages} onStageClick={handleClick} />);

    const interviewNode = screen.getByText('Interview').closest('li')?.querySelector('div[role="button"]');
    if (interviewNode) {
      fireEvent.click(interviewNode);
      expect(handleClick).toHaveBeenCalledWith(mockStages[2]);
    }
  });

  it('handles empty stages gracefully without error', () => {
    const { container } = render(<Spine stages={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
