import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Interview, SuperdayConflict } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SuperdayPage } from './SuperdayPage';
import {
  CalendarClock,
  Video,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Clock} from 'lucide-react';

export const InterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [conflicts, setConflicts] = useState<SuperdayConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'clashes'>('schedule');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getInterviews(), api.getSuperdayConflicts()])
      .then(([iRes, sRes]) => {
        setInterviews(iRes.interviews || []);
        setConflicts(sRes.conflicts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const scheduledCount = interviews.filter((i) => i.result === 'Scheduled').length;
  const passedCount = interviews.filter((i) => i.result === 'Passed').length;
  const virtualCount = interviews.filter((i) => i.mode === 'Virtual').length;
  const clashCount = conflicts.length;

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      item.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      item.round?.toLowerCase().includes(search.toLowerCase()) ||
      item.venue?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.result === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Interviews & Assessments"
        description="Candidate evaluation timelines, board schedules, and Superday constraint arbitration."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
            <Button
              variant={activeTab === 'clashes' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('clashes')}
            >
              <AlertTriangle className="h-4 w-4 mr-1.5 text-cardinal" />
              Superday Solver ({clashCount})
            </Button>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Rounds"
          value={interviews.length}
          hint="Candidate evaluations recorded"
        />
        <StatCard
          label="Upcoming / Scheduled"
          value={scheduledCount}
          hint={`${virtualCount} virtual sessions`}
        />
        <StatCard
          label="Evaluated & Passed"
          value={passedCount}
          hint={interviews.length > 0 ? `${Math.round((passedCount / interviews.length) * 100)}% clearance rate` : '0% clearance'}
        />
        <StatCard
          label="Schedule Clashes"
          value={clashCount}
          hint={clashCount > 0 ? 'Requires Superday arbitration' : 'No conflicts detected'}
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'schedule', label: `Schedule (${interviews.length})` },
          { id: 'clashes', label: `Resolve Clashes (${clashCount})` },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'clashes' ? (
        <SuperdayPage />
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="p-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Filter by student ID, round, or venue..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border border-line rounded focus:bg-surface focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-ink-muted mr-1" />
                <span className="text-xs text-ink-muted mr-1">Status:</span>
                {['ALL', 'Scheduled', 'Passed', 'Failed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-brand text-white'
                        : 'bg-canvas text-ink hover:bg-line border border-line'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Table / List */}
          {loading ? (
            <Card className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ) : filteredInterviews.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No interview schedules match filters"
              description={search ? `No records found for query "${search}".` : 'No interview schedules logged in the system.'}
            />
          ) : (
            <div className="border border-line rounded-lg overflow-hidden bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-canvas text-ink-muted font-medium uppercase tracking-wider text-xs">
                      <th className="px-4 py-3">Interview ID</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Round</th>
                      <th className="px-4 py-3">Mode & Venue</th>
                      <th className="px-4 py-3">Scheduled Window</th>
                      <th className="px-4 py-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredInterviews.map((item) => (
                      <tr key={item.interview_id} className="hover:bg-canvas/50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-brand">
                          {item.interview_id}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-ink">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-line text-ink flex items-center justify-center font-mono text-xs">
                              {item.student_id?.slice(-2)}
                            </div>
                            <span className="font-mono text-xs">{item.student_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-ink">
                          {item.round}
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted">
                          <div className="flex items-center gap-1.5">
                            {item.mode === 'Virtual' ? (
                              <Video className="h-3.5 w-3.5 text-info" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5 text-brand" />
                            )}
                            <span>{item.mode}</span>
                            {item.venue && <span className="text-xs text-ink-muted">({item.venue})</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-ink-muted text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-ink-muted" />
                            <span>
                              {item.scheduled_start ? new Date(item.scheduled_start).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }) : 'TBD'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Badge
                            variant={
                              item.result === 'Passed'
                                ? 'success'
                                : item.result === 'Failed'
                                ? 'danger'
                                : 'info'
                            }
                            size="sm"
                          >
                            {item.result}
                          </Badge>
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

