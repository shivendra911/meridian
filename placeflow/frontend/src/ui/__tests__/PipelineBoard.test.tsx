import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineBoard, PipelineColumnDef, PipelineCardItem } from '../PipelineBoard';

describe('PipelineBoard Component', () => {
  const mockColumns: PipelineColumnDef[] = [
    { id: 'applied', title: 'Applied' },
    { id: 'shortlisted', title: 'Shortlisted' },
    { id: 'interview', title: 'Interview' },
    { id: 'offer', title: 'Offer' },
  ];

  const mockCards: PipelineCardItem[] = [
    {
      id: 'app_1',
      personId: 'p_1',
      name: 'Aarav Sharma',
      registrationNumber: '2023CSB001',
      stageId: 'applied',
      chips: ['CGPA 8.45', 'CSE'],
    },
    {
      id: 'app_2',
      personId: 'p_2',
      name: 'Diya Patel',
      registrationNumber: '2023CSB002',
      stageId: 'shortlisted',
      chips: ['CGPA 9.1'],
    },
  ];

  it('renders columns and cards correctly', () => {
    render(<PipelineBoard columns={mockColumns} cards={mockCards} onMoveCard={vi.fn()} />);

    expect(screen.getByText('Applied')).toBeDefined();
    expect(screen.getByText('Shortlisted')).toBeDefined();
    expect(screen.getByText('Aarav Sharma')).toBeDefined();
    expect(screen.getByText('Diya Patel')).toBeDefined();
    expect(screen.getByText('CGPA 8.45')).toBeDefined();
  });

  it('allows moving cards via accessible "Move to" menu', () => {
    const handleMove = vi.fn();
    render(<PipelineBoard columns={mockColumns} cards={mockCards} onMoveCard={handleMove} />);

    // Open menu for Aarav Sharma
    const menuButton = screen.getByLabelText('Move Aarav Sharma to another stage');
    fireEvent.click(menuButton);

    // Target stage Shortlisted
    const moveButtons = screen.getAllByRole('button');
    const targetButton = moveButtons.find((btn) => btn.textContent?.includes('Shortlisted'));
    expect(targetButton).toBeDefined();

    if (targetButton) {
      fireEvent.click(targetButton);
      expect(handleMove).toHaveBeenCalledWith('app_1', 'shortlisted');
    }
  });
});
