import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Placement } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { RenegeRadarPage } from './RenegeRadarPage';
import {
  Award,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { resolveCompanyName } from '../../../utils/formatters';
import { SummaryStrip, PersonChip, CompanyMark, formatDate, useDocumentTitle } from '../../../ui';

export const OffersPage: React.FC = () => {
  useDocumentTitle('Offers');
  const navigate = useNavigate();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [criticalRisk, setCriticalRisk] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'register' | 'risk'>('register');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getPlacements(),
      api.getRenegeRadar().catch(() => null),
      api.getStudents().catch(() => ({ students: [] })),
    ])
      .then(([pRes, rRes, stuRes]) => {
        setPlacements(pRes.placements || []);
        const crit = rRes?.critical_count || 0;
        setCriticalRisk(crit);
        const map: Record<string, string> = {};
        (stuRes.students || []).forEach((s: any) => {
          if (s.student_id && s.name) map[s.student_id] = s.name;
        });
        setStudentNames(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOffers = placements.length;
  const avgPkg = totalOffers > 0
    ? (placements.reduce((sum, p) => sum + (p.package_lpa || 0), 0) / totalOffers).toFixed(2)
    : '0.00';
  const maxPkg = totalOffers > 0
    ? Math.max(...placements.map((p) => p.package_lpa || 0)).toFixed(2)
    : '0.00';

  const filteredPlacements = placements.filter((p) => {
    const compName = resolveCompanyName(p.company_id);
    const stuName = studentNames[p.student_id] || '';
    const matchesSearch =
      p.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      stuName.toLowerCase().includes(search.toLowerCase()) ||
      p.placement_id?.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || p.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Offers"
        description="Official placement offers registry, package compensation distribution, and candidate flight-risk monitoring."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
            <Button
              variant={activeTab === 'risk' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('risk')}
            >
              <AlertTriangle className="h-4 w-4 mr-1.5 text-cardinal" />
              Retention Radar ({criticalRisk} critical)
            </Button>
          </div>
        }
      />

      {/* Summary Strip (replaces 4 StatCards) */}
      <SummaryStrip
        items={[
          { label: 'Total offers', value: totalOffers, hint: 'Verified employment offers' },
          { label: 'Average package', value: `${avgPkg} LPA`, hint: 'Cohort mean CTC' },
          { label: 'Highest package', value: `${maxPkg} LPA`, hint: 'Super Dream marquee tier' },
          {
            label: 'Flight risk (Critical)',
            value: criticalRisk,
            hint: criticalRisk > 0 ? `${criticalRisk} candidates at-risk` : 'No critical renege threats',
          },
        ]}
      />

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'register', label: `Offers Register (${totalOffers})` },
          { id: 'risk', label: `At-Risk Offers & Retention (${criticalRisk})` },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'risk' ? (
        <RenegeRadarPage />
      ) : (
        <div className="space-y-4">
          {/* Filter Bar — 40px inline row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-h-[40px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Filter by candidate, company, or offer ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-line rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-ink-muted mr-1" />
              <span className="text-xs text-ink-muted mr-1">Tier:</span>
              {['ALL', 'Normal', 'Dream', 'Super Dream'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    tierFilter === tier
                      ? 'bg-brand text-white'
                      : 'bg-surface text-ink hover:bg-canvas border border-line'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="rounded-xl border border-line bg-surface p-6 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredPlacements.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No placement offers found"
              description={search ? `No records matched "${search}".` : 'No placement records exist in the database.'}
            />
          ) : (
            <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-canvas/60 text-ink-muted font-medium uppercase tracking-wider text-xs">
                      <th className="px-4 py-3">Offer Ref</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Employer / Partner</th>
                      <th className="px-4 py-3">Compensation</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3 text-right">Offer Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredPlacements.map((p) => {
                      const stuName = studentNames[p.student_id] || p.student_id;
                      const compName = resolveCompanyName(p.company_id);
                      return (
                        <tr key={p.placement_id} className="hover:bg-canvas/50 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-brand">
                            {p.placement_id}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-ink">
                            <PersonChip
                              name={stuName}
                              person_id={p.student_id}
                              onClick={() => navigate('/tpo/students/' + p.student_id)}
                            />
                          </td>
                          <td className="px-4 py-3.5 text-ink">
                            <div className="flex items-center gap-2 font-medium">
                              <CompanyMark name={compName} size="sm" />
                              <span className="truncate">{compName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-success tabular-nums">
                            ₹{p.package_lpa?.toFixed(2)} LPA
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                p.tier === 'Super Dream'
                                  ? 'danger'
                                  : p.tier === 'Dream'
                                  ? 'institutional'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {p.tier}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right text-ink-muted text-xs tabular-nums">
                            {p.placement_date ? formatDate(p.placement_date) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
