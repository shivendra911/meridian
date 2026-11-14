import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CampusCopilotDrawer } from '../CampusCopilotDrawer';
import { client } from '../../../core/api/client';

vi.mock('../../../core/auth/useAuth', () => ({
  useAuth: () => ({
    me: {
      account_id: 'acc_admin_001',
      person_id: 'per_admin_001',
      subject: { type: 'admin', id: 'ADM001' },
      display_name: 'System Admin',
    },
  }),
}));

vi.mock('../../../core/api/client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('CampusCopilotDrawer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<CampusCopilotDrawer isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(<CampusCopilotDrawer isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Campus AI Copilot')).toBeTruthy();
    expect(screen.getByText('Policy RAG')).toBeTruthy();
    expect(screen.getByText('Autonomous Agents')).toBeTruthy();
    expect(screen.getByText('Audit Ledger')).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<CampusCopilotDrawer isOpen={true} onClose={handleClose} />);
    const closeBtn = screen.getByLabelText('Close copilot');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('submits a policy RAG query and renders the response', async () => {
    (client.post as any).mockResolvedValueOnce({
      answer: 'Dream offer holders may apply for Super Dream roles per Policy §4.2.',
      groundedness_score: 0.95,
      trace_id: 'trace_test_rag_001',
      total_tokens: 142,
      citations: [
        {
          doc_title: 'Placement Regulations',
          version: '2026.1',
          section_heading: 'Multi-Tier Entitlement',
          source_authority: 'Senate Resolution',
        },
      ],
    });

    render(<CampusCopilotDrawer isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Ask about placement policy/i);
    fireEvent.change(input, { target: { value: 'Can I apply for Super Dream?' } });

    const submitBtn = screen.getByText('Ask Copilot');
    fireEvent.click(submitBtn);

    expect(client.post).toHaveBeenCalledWith('/v4/ai/rag/', {
      query: 'Can I apply for Super Dream?',
    });

    await waitFor(() => {
      expect(screen.getByText(/Dream offer holders may apply/i)).toBeTruthy();
      expect(screen.getByText('Groundedness: 95%')).toBeTruthy();
      expect(screen.getByText(/Placement Regulations/i)).toBeTruthy();
    });
  });

  it('executes an autonomous agent and renders tool results', async () => {
    (client.post as any).mockResolvedValueOnce({
      agent_name: 'JNFIntelligenceAgent',
      status: 'COMPLETED',
      summary: 'Role classified as Super Dream at 26.5 LPA.',
      governance_level: 'L1',
      tool_results: [
        {
          tool_name: 'ctc_bracket_analyzer',
          risk_tier: 'L0',
          status: 'SUCCESS',
          requires_human_approval: false,
        },
      ],
    });

    render(<CampusCopilotDrawer isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Autonomous Agents'));

    expect(screen.getByText(/Agent Payload Parameters/i)).toBeTruthy();
    const executeBtn = screen.getByText(/Execute JNFIntelligenceAgent/i);
    fireEvent.click(executeBtn);

    expect(client.post).toHaveBeenCalledWith(
      '/v4/ai/agent/execute/',
      expect.objectContaining({
        agent_name: 'JNFIntelligenceAgent',
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Role classified as Super Dream/i)).toBeTruthy();
      expect(screen.getByText('ctc_bracket_analyzer')).toBeTruthy();
    });
  });
});
