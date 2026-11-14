import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { client } from '../../core/api/client';
import { ApiError } from '../../core/api/errors';
import { TenantContext } from '../../context/TenantContext';

import { StudentOpportunitiesPage } from '../../portals/student/pages/OpportunitiesPage';
import { OverviewPage as TpoOverviewPage } from '../../portals/tpo/pages/OverviewPage';
import { DrivesPage as TpoDrivesPage } from '../../portals/tpo/pages/DrivesPage';
import { ApplicationsPage as TpoApplicationsPage } from '../../portals/tpo/pages/ApplicationsPage';
import { FacultyHomePage } from '../../portals/faculty/pages/HomePage';
import { HodHomePage } from '../../portals/hod/pages/HomePage';
import { ManagementHomePage } from '../../portals/management/pages/HomePage';

vi.mock('../../core/api/client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('../../core/auth/useAuth', () => ({
  useAuth: () => ({
    me: {
      account_id: 'acc_test',
      username: 'test_user',
      display_name: 'Dr. Test User',
      roles: ['TPO_ADMIN', 'FACULTY_MENTOR', 'DEPARTMENT_HEAD', 'INSTITUTION_HEAD'],
      permissions: ['*'],
      portals: ['tpo', 'student', 'faculty', 'hod', 'management', 'admin'],
      default_portal: 'tpo',
    },
    status: 'authed',
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockTenantContext = {
  tenants: [{ tenant_id: 'ten_001', name: 'Test Tenant', tier: 'ENTERPRISE', is_active: true }],
  institutions: [{ institution_id: 'inst_001', tenant_id: 'ten_001', name: 'Test Inst', code: 'TI', is_active: true }],
  campuses: [{ campus_id: 'camp_001', institution_id: 'inst_001', name: 'Main Campus', is_active: true }],
  activeTenant: { tenant_id: 'ten_001', name: 'Test Tenant', tier: 'ENTERPRISE', is_active: true },
  activeInstitution: { institution_id: 'inst_001', tenant_id: 'ten_001', name: 'Test Inst', code: 'TI', is_active: true },
  activeCampus: { campus_id: 'camp_001', institution_id: 'inst_001', name: 'Main Campus', is_active: true },
  setActiveTenant: vi.fn(),
  setActiveInstitution: vi.fn(),
  setActiveCampus: vi.fn(),
  refreshTenantHierarchy: vi.fn(),
};

describe('Phase C: Empty, Error, Forbidden, and Malformed Response Parity across Portals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Student Portal', () => {
    it('handles empty [] opportunities gracefully without crashing', async () => {
      vi.mocked(client.get).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <StudentOpportunitiesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Opportunities')).toBeDefined();
      });
      expect(screen.getByText('0 open')).toBeDefined();
      expect(screen.getByText('No Drives Available')).toBeDefined();
    });

    it('renders ErrorState when API throws 500 Server Error', async () => {
      vi.mocked(client.get).mockRejectedValue(new ApiError(500, 'ServerError', 'Internal Server Error'));

      render(
        <MemoryRouter>
          <StudentOpportunitiesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
      });
      expect(screen.getByText('Internal Server Error')).toBeDefined();
    });

    it('renders ErrorState when API returns 403 Forbidden', async () => {
      vi.mocked(client.get).mockRejectedValue(new ApiError(403, 'Forbidden', 'Permission denied'));

      render(
        <MemoryRouter>
          <StudentOpportunitiesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
      });
      expect(screen.getByText(/permission to access this resource|forbidden/i)).toBeDefined();
    });

    it('renders ErrorState on malformed response object', async () => {
      vi.mocked(client.get).mockResolvedValue({ notAnArray: 123 });

      render(
        <MemoryRouter>
          <StudentOpportunitiesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
      });
      expect(screen.getByText(/invalid or malformed/i)).toBeDefined();
    });
  });

  describe('TPO Portal', () => {
    it('handles empty drives [] gracefully on DrivesPage', async () => {
      vi.mocked(client.get).mockResolvedValue({ count: 0, jobs: [] });

      render(
        <MemoryRouter>
          <TpoDrivesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Drives')).toBeDefined();
      });
      expect(screen.getByText('0 total')).toBeDefined();
      expect(screen.getByText('No drives yet')).toBeDefined();
    });

    it('handles empty applications [] gracefully on ApplicationsPage', async () => {
      vi.mocked(client.get).mockResolvedValue({ count: 0, applications: [] });

      render(
        <MemoryRouter>
          <TpoApplicationsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Applications')).toBeDefined();
      });
      expect(screen.getByText('0 total')).toBeDefined();
      expect(screen.getByText('No candidate applications match filters')).toBeDefined();
    });

    it('renders ErrorState on 500 Server Error in TPO Overview', async () => {
      vi.mocked(client.get).mockRejectedValue(new ApiError(500, 'ServerError', 'Database failure'));

      render(
        <MemoryRouter>
          <TenantContext.Provider value={mockTenantContext as any}>
            <TpoOverviewPage />
          </TenantContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
      });
      expect(screen.getByText('Failed to Load Placement Overview')).toBeDefined();
    });
  });

  describe('Academic & Executive Portals', () => {
    it('renders FacultyHomePage with What Needs Me Now task cards and no crash', () => {
      render(
        <MemoryRouter>
          <FacultyHomePage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Faculty Advising/i)).toBeDefined();
      expect(screen.getByText('What Needs Me Now')).toBeDefined();
    });

    it('renders HodHomePage without crashing', () => {
      render(
        <MemoryRouter>
          <HodHomePage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Department Leadership/i)).toBeDefined();
    });

    it('renders ManagementHomePage with Executive Management title and no crash', () => {
      render(
        <MemoryRouter>
          <ManagementHomePage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Executive Management/i)).toBeDefined();
    });
  });
});
