import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Placement, RenegeCandidate } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { RenegeRadarPage } from './RenegeRadarPage';
import { resolveCompanyName } from '../../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Building2} from 'lucide-react';

export const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [radarData, setRadarData] = useState<{
    total_placed_monitored: number;
    critical_count: number;
    moderate_count: number;
    low_count: number;
    avg_renege_probability: number;
    candidates: RenegeCandidate[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'register' | 'risk'>('register');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getPlacements(), api.getRenegeRadar()])
      .then(([pRes, rRes]) => {
        setPlacements(pRes.placements || []);
        setRadarData(rRes || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOffers = placements.length;
  const packages = placements.map((p) => p.package_lpa || 0).filter((pkg) => pkg > 0);
  const avgPkg = packages.length > 0 ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1) : '0.0';
  const maxPkg = packages.length > 0 ? Math.max(...packages).toFixed(1) : '0.0';
  const criticalRisk = radarData?.critical_count || 0;

  const filteredPlacements = placements.filter((p) => {
    const compName = resolveCompanyName(p.company_id);
    const matchesSearch =
      p.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      p.company_id?.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase()) ||
      p.placement_id?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || p.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Offers & Post-Offer Retention"
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

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Offers"
          value={totalOffers}
          hint="Verified employment offers"
        />
        <StatCard
          label="Average Package"
          value={`${avgPkg} LPA`}
          hint="Institution cohort mean"
        />
        <StatCard
          label="Highest Package"
          value={`${maxPkg} LPA`}
          hint="Super Dream marquee tier"
        />
        <StatCard
          label="Flight Risk (Critical)"
          value={criticalRisk}
          hint={criticalRisk > 0 ? `${criticalRisk} candidates flagged at-risk` : 'No critical renege threats'}
        />
      </div>

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
          {/* Filter Bar */}
          <Card className="p-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Filter by candidate, company, or offer ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border border-line rounded focus:bg-surface focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-ink-muted mr-1" />
                <span className="text-xs text-ink-muted mr-1">Tier:</span>
                {['ALL', 'Normal', 'Dream', 'Super Dream'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setTierFilter(tier)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      tierFilter === tier
                        ? 'bg-brand text-white'
                        : 'bg-canvas text-ink hover:bg-line border border-line'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Table */}
          {loading ? (
            <Card className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ) : filteredPlacements.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No placement offers found"
              description={search ? `No records matched "${search}".` : 'No placement records exist in the database.'}
            />
          ) : (
            <div className="border border-line rounded-lg overflow-hidden bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-canvas text-ink-muted font-medium uppercase tracking-wider text-xs">
                      <th className="px-4 py-3">Offer Ref</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Employer / Partner</th>
                      <th className="px-4 py-3">Compensation</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3 text-right">Offer Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredPlacements.map((p) => (
                      <tr key={p.placement_id} className="hover:bg-canvas/50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-brand">
                          {p.placement_id}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-ink">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-line text-ink flex items-center justify-center font-mono text-xs">
                              {p.student_id?.slice(-2)}
                            </div>
                            <button onClick={() => navigate('/tpo/students/' + p.student_id)} className="font-mono text-xs font-semibold text-brand hover:underline cursor-pointer">{p.student_id}</button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-ink">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-ink-muted" />
                            <span>{resolveCompanyName(p.company_id)}</span>
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
                        <td className="px-4 py-3.5 text-right font-mono text-ink-muted text-xs">
                          {p.placement_date ? new Date(p.placement_date).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }) : '—'}
                        </td>
                      </tr>
                    ))}
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
