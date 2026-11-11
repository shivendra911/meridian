import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AccountLayout } from '../layout';
import { AuthContext, AuthContextType } from '../../core/auth/AuthProvider';

const createMockAuthContext = (role = 'STUDENT_MEMBER'): AuthContextType => ({
  status: 'authed',
  me: {
    account_id: 'acc_001',
    person_id: 'per_001',
    display_name: 'Test Member',
    tenant_id: 'tenant_default',
    institution_id: 'inst_default',
    subject: { type: 'STUDENT', id: 'STU001' },
    assignments: [{ role_code: role, scope_type: 'TENANT', scope_id: 'tenant_default' }],
    permissions: ['*'],
    portals: ['student'],
    default_portal: 'student',
    delegation: null,
    break_glass: null,
    profile: {
      display_name: 'Test Member',
      email: 'test@meridian.edu',
      affiliation_label: 'Registered Member',
      institution_name: 'Apex Institute of Technology',
      department: 'CSE',
      avatar_url: null,
    },
    unread_notifications: 0,
  },
  sessionExpired: false,
  dismissSessionExpired: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  can: vi.fn(() => true),
  canAny: vi.fn(() => true),
  canAll: vi.fn(() => true),
  hasPortal: vi.fn(() => true),
  switchPortal: vi.fn(),
  refreshMe: vi.fn(),
});

describe('Account Area Layout & Navigation', () => {
  it('renders navigation tabs and is reachable by student role', () => {
    const authCtx = createMockAuthContext('STUDENT_MEMBER');

    render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter initialEntries={['/account/profile']}>
          <Routes>
            <Route path="/account" element={<AccountLayout />}>
              <Route path="profile" element={<div>Profile Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Account & Settings')).toBeDefined();
    expect(screen.getByText('Profile')).toBeDefined();
    expect(screen.getByText('Security & Sessions')).toBeDefined();
    expect(screen.getByText('Notifications')).toBeDefined();
    expect(screen.getByText('Privacy & Data Rights')).toBeDefined();
    expect(screen.getByText('Profile Content')).toBeDefined();
  });

  it('renders navigation tabs and is reachable by faculty role', () => {
    const authCtx = createMockAuthContext('FACULTY_MENTOR');

    render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter initialEntries={['/account/security']}>
          <Routes>
            <Route path="/account" element={<AccountLayout />}>
              <Route path="security" element={<div>Security Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Account & Settings')).toBeDefined();
    expect(screen.getByText('Security Content')).toBeDefined();
  });

  it('renders navigation tabs and is reachable by admin role', () => {
    const authCtx = createMockAuthContext('INSTITUTION_ADMIN');

    render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter initialEntries={['/account/privacy']}>
          <Routes>
            <Route path="/account" element={<AccountLayout />}>
              <Route path="privacy" element={<div>Privacy Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Account & Settings')).toBeDefined();
    expect(screen.getByText('Privacy Content')).toBeDefined();
  });
});
