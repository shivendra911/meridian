import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudentShell } from '../StudentShell';
import { AuthContext, AuthContextValue } from '../../../core/auth/AuthProvider';

function createMockAuth(): AuthContextValue {
  return {
    status: 'authenticated',
    me: {
      account_id: 'acc_1',
      person_id: 'p_1',
      display_name: 'Aarav Sharma',
      tenant_id: 'ten_default',
      institution_id: 'inst_1',
      subject: { type: 'student', id: 'STU001' },
      assignments: [{ role_code: 'STUDENT_MEMBER', scope_type: 'SELF' }],
      permissions: ['placement.application.create', 'student.profile.update_self'],
      portals: ['student'],
      default_portal: 'student',
      profile: {
        display_name: 'Aarav Sharma',
        affiliation_label: 'Student',
      },
      unread_notifications: 3,
    },
    login: vi.fn(),
    logout: vi.fn(),
    can: () => true,
    hasRole: () => true,
    switchContext: vi.fn(),
    sessionExpired: false,
    dismissSessionExpired: vi.fn(),
  };
}

describe('StudentShell Component', () => {
  it('renders student navigation tabs and NO sidebar', () => {
    const auth = createMockAuth();

    const { container } = render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/student/home']}>
          <StudentShell />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Verify 4 main tabs exist in the DOM
    expect(screen.getAllByText('Journey').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Drives').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Inbox').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Me').length).toBeGreaterThan(0);

    // Verify NO sidebar element exists
    const sidebar = container.querySelector('aside');
    expect(sidebar).toBeNull();

    // Verify mobile bottom tab bar exists
    const bottomNav = screen.getByLabelText('Student Mobile Navigation');
    expect(bottomNav).toBeDefined();

    // Verify desktop top nav exists
    const topNav = screen.getByLabelText('Main Navigation');
    expect(topNav).toBeDefined();
  });
});
