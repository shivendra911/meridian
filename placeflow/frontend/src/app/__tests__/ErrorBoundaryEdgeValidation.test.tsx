import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { StudentHomePage } from '../../portals/student/pages/HomePage';
import { OverviewPage } from '../../portals/tpo/pages/OverviewPage';
import { client } from '../../core/api/client';
import { TenantContext } from '../../context/TenantContext';

// Mock client
vi.mock('../../core/api/client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
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

describe('Phase A: Edge Validation and Error Boundary Proof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('catches render errors in ErrorBoundary and displays accessible ErrorState with errorId', () => {
    const ProblemChild = () => {
      throw new Error('Test render crash simulation');
    };

    // Suppress console.error in test output for expected boundary catch
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Something went wrong on this page')).toBeDefined();
    expect(screen.getByText(/Test render crash simulation/)).toBeDefined();
    expect(screen.getByText(/Error ID:/)).toBeDefined();
    expect(screen.getByText('Reload')).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('renders ErrorState in /student/home when API returns empty object {} instead of white page', async () => {
    // When API returns {} for all endpoints
    vi.mocked(client.get).mockResolvedValue({});

    render(
      <MemoryRouter>
        <StudentHomePage />
      </MemoryRouter>
    );

    // Should not crash, should show ErrorState
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });

    expect(screen.queryByText('Explore Opportunities')).toBeNull();
    expect(screen.getByText(/Invalid API response format|malformed/i)).toBeDefined();
  });

  it('renders ErrorState in /tpo/home when API returns empty object {} instead of white page', async () => {
    // When API returns {} for getOverview
    vi.mocked(client.get).mockResolvedValue({});

    render(
      <MemoryRouter>
        <TenantContext.Provider value={mockTenantContext as any}>
          <OverviewPage />
        </TenantContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });

    expect(screen.getByText('Failed to Load Placement Overview')).toBeDefined();
    expect(screen.getByText(/Invalid API response format|malformed/i)).toBeDefined();
  });
});
