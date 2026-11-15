import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Radar,
  Scale,
  Zap,
  Cpu,
} from 'lucide-react';

export interface InsightsTabItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const INSIGHTS_TABS: InsightsTabItem[] = [
  { id: 'reports', label: 'Reports & Aggregations', path: '/tpo/insights/reports', icon: BarChart3 },
  { id: 'renege', label: 'Renege Radar (ML-02)', path: '/tpo/insights/renege', icon: Radar },
  { id: 'fairness', label: 'Fairness Auditor (ML-04)', path: '/tpo/insights/fairness', icon: Scale },
  { id: 'superday', label: 'Superday Optimizer', path: '/tpo/insights/superday', icon: Zap },
  { id: 'models', label: 'Model Registry', path: '/tpo/insights/models', icon: Cpu },
];

export const InsightsNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav aria-label="Insights Sub-Navigation" className="flex items-center gap-1.5 p-1 bg-surface border border-line rounded-2xl mb-6 overflow-x-auto shadow-xs">
      {INSIGHTS_TABS.map((tab) => {
        const isActive = location.pathname.startsWith(tab.path);
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(tab.path)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-ink text-white shadow-xs font-bold'
                : 'text-ink-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            <Icon size={14} className={isActive ? 'text-amber-400' : 'text-ink-muted'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
