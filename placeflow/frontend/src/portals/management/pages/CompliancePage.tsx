/**
 * PlaceFlow / Meridian — Management Compliance & AI Governance (Phase 6).
 *
 * Integrated regulatory oversight: DPDP statutory consent, algorithmic fairness, and AI audit ledger.
 */

import React, { useState } from 'react';
import { ShieldCheck, Scale, Cpu } from 'lucide-react';
import { PageHeader, Tabs } from '../../../ui';
import { ConsentPage } from '../../../pages/ConsentPage';
import { FairnessPage } from '../../../pages/FairnessPage';
import { AgentRunsPage } from '../../../pages/AgentRunsPage';

export const ManagementCompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consent' | 'fairness' | 'ai'>('consent');

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Institutional Compliance &amp; AI Safety Audit"
        description="Statutory DPDP consent verification, demographic fairness auditing, and automated agent audit logs."
      />

      <div className="flex items-center gap-2 border-b border-line pb-px">
        <button
          onClick={() => setActiveTab('consent')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'consent' ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <ShieldCheck size={15} />
          <span>DPDP Act 2023 Consent</span>
        </button>

        <button
          onClick={() => setActiveTab('fairness')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'fairness' ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Scale size={15} />
          <span>Equal Opportunity &amp; Fairness</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ai' ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Cpu size={15} />
          <span>AI Copilot Audit Ledger</span>
        </button>
      </div>

      <div>
        {activeTab === 'consent' && <ConsentPage initialStudentId="STU001" />}
        {activeTab === 'fairness' && <FairnessPage />}
        {activeTab === 'ai' && <AgentRunsPage onOpenCopilot={() => {}} />}
      </div>
    </div>
  );
};
