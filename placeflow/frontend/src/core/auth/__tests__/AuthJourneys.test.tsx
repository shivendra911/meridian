import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionExpiredDialog } from '../SessionExpiredDialog';
import { ClaimPage } from '../ClaimPage';
import { LoginPage } from '../LoginPage';
import { AuthContext, AuthContextType } from '../AuthProvider';

const createMockAuth = (overrides?: Partial<AuthContextType>): AuthContextType => ({
  status: 'authed',
  me: {
    account_id: 'acc_001',
    person_id: 'per_001',
    display_name: 'Aarav Sharma',
    tenant_id: 'tenant_default',
    institution_id: 'inst_default',
    subject: { type: 'STUDENT', id: 'STU001' },
    assignments: [{ role_code: 'STUDENT_MEMBER', scope_type: 'TENANT', scope_id: 'tenant_default' }],
    permissions: ['*'],
    portals: ['student'],
    default_portal: 'student',
    delegation: null,
    break_glass: null,
    profile: {
      display_name: 'Aarav Sharma',
      email: 'aarav@meridian.edu',
      affiliation_label: 'Student',
      institution_name: 'Apex Institute',
      department: 'CSE',
      avatar_url: null,
    },
    unread_notifications: 0,
  },
  sessionExpired: false,
  dismissSessionExpired: vi.fn(),
  login: vi.fn(async () => ({} as any)),
  logout: vi.fn(),
  can: vi.fn(() => true),
  canAny: vi.fn(() => true),
  canAll: vi.fn(() => true),
  hasPortal: vi.fn(() => true),
  switchPortal: vi.fn(),
  refreshMe: vi.fn(),
  ...overrides,
});

describe('Auth Journeys & Session Security', () => {
  it('does not render SessionExpiredDialog when session is valid', () => {
    const authCtx = createMockAuth({ sessionExpired: false });
    render(
      <AuthContext.Provider value={authCtx}>
        <SessionExpiredDialog />
      </AuthContext.Provider>
    );

    expect(screen.queryByText('Session Expired')).toBeNull();
  });

  it('renders SessionExpiredDialog when sessionExpired is true and handles re-auth', async () => {
    const loginMock = vi.fn(async () => ({} as any));
    const authCtx = createMockAuth({
      sessionExpired: true,
      login: loginMock,
    });

    render(
      <AuthContext.Provider value={authCtx}>
        <SessionExpiredDialog />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Session Expired')).toBeDefined();
    expect(screen.getByText('Resume session')).toBeDefined();

    const pwdInput = screen.getByPlaceholderText('••••••••••••');
    fireEvent.change(pwdInput, { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('Resume session'));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('aarav@meridian.edu', 'password123');
    });
  });

  it('renders ClaimPage with step 1 identity fields', () => {
    const authCtx = createMockAuth({ status: 'anon', me: null });

    render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter>
          <ClaimPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Claim Student Account')).toBeDefined();
    expect(screen.getByText('Registration Number / Student ID')).toBeDefined();
    expect(screen.getByText('Institutional Email on Record')).toBeDefined();
    expect(screen.getByText('Continue')).toBeDefined();
  });

  it('renders LoginPage with credentials form and claim link', () => {
    const authCtx = createMockAuth({ status: 'anon', me: null });

    render(
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Sign in to your account')).toBeDefined();
    expect(screen.getByText('Claim your account')).toBeDefined();
    expect(screen.getByText('Forgot password?')).toBeDefined();
  });
});
