import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserMenu } from '../UserMenu';
import { WorkspaceSwitcher } from '../WorkspaceSwitcher';
import { AuthContext, AuthContextType } from '../../../core/auth/AuthProvider';

const createMockAuthContext = (overrides?: Partial<AuthContextType>): AuthContextType => ({
  status: 'authed',
  me: {
    account_id: 'acc_001',
    person_id: 'per_001',
    display_name: 'Aarav Sharma',
    tenant_id: 'tenant_default',
    institution_id: 'inst_default',
    subject: { type: 'STUDENT', id: 'STU001' },
    assignments: [{ role_code: 'STUDENT_MEMBER', scope_type: 'TENANT', scope_id: 'tenant_default' }],
    permissions: ['placement.application.create'],
    portals: ['student'],
    default_portal: 'student',
    delegation: null,
    break_glass: null,
    profile: {
      display_name: 'Aarav Sharma',
      email: 'aarav@meridian.edu',
      affiliation_label: 'Registered Student',
      institution_name: 'NIT Karnataka',
      department: 'CSE',
      avatar_url: null,
    },
    unread_notifications: 2,
  },
  login: vi.fn(),
  logout: vi.fn(),
  can: vi.fn(() => true),
  canAny: vi.fn(() => true),
  canAll: vi.fn(() => true),
  hasPortal: vi.fn(() => true),
  switchPortal: vi.fn(),
  refreshMe: vi.fn(),
  ...overrides,
});

describe('UserMenu Component', () => {
  it('renders trigger avatar and opens mini profile card on click', () => {
    const authCtx = createMockAuthContext();

    render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter>
          <UserMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Initial state: menu popover not visible
    expect(screen.queryByText('View profile')).toBeNull();

    // Click trigger button
    const trigger = screen.getByTitle('Open user settings & profile');
    fireEvent.click(trigger);

    // Menu content visible
    expect(screen.getByText('View profile')).toBeDefined();
    expect(screen.getByText('Account settings')).toBeDefined();
    expect(screen.getByText('Sign out')).toBeDefined();
    expect(screen.getByText('aarav@meridian.edu')).toBeDefined();
    expect(screen.getByText('NIT Karnataka')).toBeDefined();
    expect(screen.getByText('Registered Student')).toBeDefined();
  });

  it('calls logout when Sign Out is clicked', () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    const authCtx = createMockAuthContext({ logout: logoutMock });

    render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter>
          <UserMenu />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const trigger = screen.getByTitle('Open user settings & profile');
    fireEvent.click(trigger);

    const signOutBtn = screen.getByText('Sign out');
    fireEvent.click(signOutBtn);

    expect(logoutMock).toHaveBeenCalled();
  });
});

describe('WorkspaceSwitcher Component', () => {
  it('does not render switcher dropdown when user has only 1 portal', () => {
    const authCtx = createMockAuthContext();

    const { container } = render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter>
          <WorkspaceSwitcher currentPortal="student" compact />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Dropdown button absent
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders dropdown and portal options when user has multiple portals', () => {
    const switchPortalMock = vi.fn();
    const authCtx = createMockAuthContext({
      switchPortal: switchPortalMock,
      me: {
        ...createMockAuthContext().me!,
        portals: ['student', 'tpo', 'faculty'],
      },
    });

    render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter>
          <WorkspaceSwitcher currentPortal="student" />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const trigger = screen.getByTitle('Switch institutional workspace');
    expect(trigger).toBeDefined();

    // Open dropdown
    fireEvent.click(trigger);

    expect(screen.getByText('Available Workspaces')).toBeDefined();
    expect(screen.getByText('Training & Placement Office')).toBeDefined();
    expect(screen.getByText('Faculty Mentorship')).toBeDefined();

    // Select TPO workspace
    fireEvent.click(screen.getByText('Training & Placement Office'));
    expect(switchPortalMock).toHaveBeenCalledWith('tpo');
  });
});
