import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabBar, BottomTabItem } from '../BottomTabBar';
import { Compass, Briefcase, Bell, User } from 'lucide-react';

describe('BottomTabBar Component', () => {
  const mockTabs: BottomTabItem[] = [
    { id: 'journey', label: 'Journey', icon: Compass, path: '/student/home' },
    { id: 'drives', label: 'Drives', icon: Briefcase, path: '/student/opportunities' },
    { id: 'inbox', label: 'Inbox', icon: Bell, path: '/student/inbox', badge: 2 },
    { id: 'me', label: 'Me', icon: User, path: '/student/profile' },
  ];

  it('renders all 4 tabs with labels and badges', () => {
    render(<BottomTabBar tabs={mockTabs} activeTab="/student/home" onSelectTab={vi.fn()} />);

    expect(screen.getByText('Journey')).toBeDefined();
    expect(screen.getByText('Drives')).toBeDefined();
    expect(screen.getByText('Inbox')).toBeDefined();
    expect(screen.getByText('Me')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });

  it('indicates active tab via aria-current="page"', () => {
    render(<BottomTabBar tabs={mockTabs} activeTab="/student/opportunities" onSelectTab={vi.fn()} />);

    const drivesButton = screen.getByText('Drives').closest('button');
    expect(drivesButton?.getAttribute('aria-current')).toBe('page');

    const journeyButton = screen.getByText('Journey').closest('button');
    expect(journeyButton?.getAttribute('aria-current')).toBeNull();
  });

  it('calls onSelectTab when a tab is pressed', () => {
    const handleSelect = vi.fn();
    render(<BottomTabBar tabs={mockTabs} activeTab="/student/home" onSelectTab={handleSelect} />);

    fireEvent.click(screen.getByText('Inbox'));
    expect(handleSelect).toHaveBeenCalledWith('/student/inbox');
  });
});
