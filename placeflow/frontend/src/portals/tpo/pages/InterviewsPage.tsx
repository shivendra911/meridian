import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Interview, SuperdayConflict } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
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
  Clock,
  LayoutList,
  Table as TableIcon,
} from 'lucide-react';
import { SummaryStrip, PersonChip, formatDateTime, useDocumentTitle } from '../../../ui';

function formatTime(isoString?: string) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function groupInterviewsByDay(interviews: Interview[]) {
  const groups: { label: string; dateKey: string; items: Interview[] }[] = [];
  const map = new Map<string, { label: string; dateKey: string; items: Interview[] }>();

  const sorted = [...interviews].sort((a, b) => {
    return new Date(a.scheduled_start || 0).getTime() - new Date(b.scheduled_start || 0).getTime();
  });

  const now = new Date();
  const todayStr = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  sorted.forEach((item) => {
    if (!item.scheduled_start) {
      const key = 'unscheduled';
      if (!map.has(key)) {
        const group = { label: 'Unscheduled', dateKey: key, items: [] };
        map.set(key, group);
        groups.push(group);
      }
      map.get(key)!.items.push(item);
      return;
    }

    const d = new Date(item.scheduled_start);
    const dateStr = d.toDateString();
    let label = '';
    if (dateStr === todayStr) {
      label = 'Today';
    } else if (dateStr === tomorrowStr) {
      label = 'Tomorrow';
    } else {
      label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    if (!map.has(dateStr)) {
      const group = { label, dateKey: dateStr, items: [] };
      map.set(dateStr, group);
      groups.push(group);
    }
    map.get(dateStr)!.items.push(item);
  });

  return groups;
}

export const InterviewsPage: React.FC = () => {
  useDocumentTitle('Interviews');
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState<SuperdayConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'clashes'>('schedule');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getInterviews(),
      api.getSuperdayConflicts().catch(() => ({ conflicts: [] })),
      api.getStudents().catch(() => ({ students: [] })),
    ])
      .then(([iRes, sRes, stuRes]) => {
        setInterviews(iRes.interviews || []);
        setConflicts(sRes.conflicts || []);
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

  const scheduledCount = interviews.filter((i) => i.result === 'Scheduled').length;
  const passedCount = interviews.filter((i) => i.result === 'Passed').length;
  const virtualCount = interviews.filter((i) => i.mode === 'Virtual' || (i.mode as string) === 'ONLINE').length;
  const clashCount = conflicts.length;

  const filteredInterviews = interviews.filter((item) => {
    const studentName = item.student_name || studentNames[item.student_id] || '';
    const matchesSearch =
      item.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      item.round?.toString().toLowerCase().includes(search.toLowerCase()) ||
      item.venue?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.result === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const grouped = groupInterviewsByDay(filteredInterviews);

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Interviews"
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

      {/* Summary Strip (replaces 4 StatCards) */}
      <SummaryStrip
        items={[
          { label: 'Total rounds', value: interviews.length, hint: 'Candidate evaluations recorded' },
          { label: 'Upcoming / Scheduled', value: scheduledCount, hint: `${virtualCount} virtual sessions` },
          {
            label: 'Evaluated & Passed',
            value: passedCount,
            hint: interviews.length > 0 ? `${Math.round((passedCount / interviews.length) * 100)}% clearance rate` : '0% clearance',
          },
          {
            label: 'Schedule clashes',
            value: clashCount,
            hint: clashCount > 0 ? 'Requires Superday arbitration' : 'No conflicts detected',
          },
        ]}
      />

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
          {/* Filter Bar — 40px inline row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-h-[40px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Filter by candidate, ID, round, or venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-line rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-ink-muted mr-1" />
              <span className="text-xs text-ink-muted mr-1">Status:</span>
              {['ALL', 'Scheduled', 'Passed', 'Failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors macos-press-sm ${
                    statusFilter === st
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-surface text-ink hover:bg-canvas border border-line'
                  }`}
                >
                  {st}
                </button>
              ))}

              {/* View Toggle */}
              <div className="flex items-center ml-2 pl-2 border-l border-line gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`p-1.5 rounded transition-colors macos-press-sm ${
                    viewMode === 'grouped' ? 'bg-brand text-white shadow-xs' : 'text-ink-muted hover:text-ink'
                  }`}
                  title="Grouped by day"
                >
                  <LayoutList size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition-colors macos-press-sm ${
                    viewMode === 'table' ? 'bg-brand text-white shadow-xs' : 'text-ink-muted hover:text-ink'
                  }`}
                  title="Table view"
                >
                  <TableIcon size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Content */}
          {loading ? (
            <div className="rounded-xl border border-line bg-surface p-6 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredInterviews.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No interview schedules match filters"
              description={search ? `No records found for query "${search}".` : 'No interview schedules logged in the system.'}
            />
          ) : viewMode === 'grouped' ? (
            /* Day-Grouped View */
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.dateKey} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      {group.label}
                    </span>
                    <span className="text-xs text-ink-muted">· {group.items.length} {group.items.length === 1 ? 'round' : 'rounds'}</span>
                  </div>

                  <div className="rounded-xl border border-line bg-surface divide-y divide-line overflow-hidden shadow-xs">
                    {group.items.map((item) => {
                      const studentName = item.student_name || studentNames[item.student_id] || item.student_id;
                      return (
                        <div
                          key={item.interview_id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-canvas/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Time on left */}
                            <div className="w-14 shrink-0 font-mono text-xs font-semibold text-ink">
                              {formatTime(item.scheduled_start)}
                            </div>

                            {/* PersonChip with Avatar, Name, and Reg No */}
                            <PersonChip
                              name={studentName}
                              person_id={item.student_id}
                              onClick={() => navigate(`/tpo/students/${item.student_id}`)}
                            />

                            {/* Round & Mode/Venue */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-semibold text-ink">Round: {item.round}</span>
                              <span className="text-ink-muted">·</span>
                              <div className="flex items-center gap-1 text-ink-muted">
                                {item.mode === 'Virtual' || (item.mode as string) === 'ONLINE' ? (
                                  <Video className="h-3.5 w-3.5 text-info shrink-0" />
                                ) : (
                                  <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
                                )}
                                <span>{item.mode}</span>
                                {item.venue && <span>({item.venue})</span>}
                              </div>
                            </div>
                          </div>

                          {/* Status Result Chip */}
                          <div className="shrink-0 flex items-center gap-2 pl-14 sm:pl-0">
                            <span className="text-xs font-mono text-ink-muted">{item.interview_id}</span>
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-canvas/60 text-ink-muted font-medium uppercase tracking-wider text-xs">
                      <th className="px-4 py-3">Interview ID</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Round</th>
                      <th className="px-4 py-3">Mode & Venue</th>
                      <th className="px-4 py-3">Scheduled Window</th>
                      <th className="px-4 py-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredInterviews.map((item) => {
                      const studentName = item.student_name || studentNames[item.student_id] || item.student_id;
                      return (
                        <tr key={item.interview_id} className="hover:bg-canvas/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-brand">
                            {item.interview_id}
                          </td>
                          <td className="px-4 py-3 font-medium text-ink">
                            <PersonChip
                              name={studentName}
                              person_id={item.student_id}
                              onClick={() => navigate(`/tpo/students/${item.student_id}`)}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-ink">
                            {item.round}
                          </td>
                          <td className="px-4 py-3 text-ink-muted">
                            <div className="flex items-center gap-1.5">
                              {item.mode === 'Virtual' || (item.mode as string) === 'ONLINE' ? (
                                <Video className="h-3.5 w-3.5 text-info" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-brand" />
                              )}
                              <span>{item.mode}</span>
                              {item.venue && <span className="text-xs text-ink-muted">({item.venue})</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-ink-muted text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-ink-muted" />
                              <span>
                                {item.scheduled_start ? formatDateTime(item.scheduled_start) : 'TBD'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
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
