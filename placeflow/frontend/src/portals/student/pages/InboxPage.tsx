import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { client } from '../../../core/api/client';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../ui/ErrorState';
import { formatRelative } from '../../../ui/format';
import { useDocumentTitle } from '../../../ui/useDocumentTitle';

interface NotificationRecord {
  notification_id: string;
  kind: string;
  title: string;
  body: string;
  link?: string | null;
  created_at: string;
  read_at?: string | null;
}

export const InboxPage: React.FC = () => {
  useDocumentTitle('Student Inbox & Alerts');
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const loadInbox = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get<{ notifications: NotificationRecord[]; unread_count: number }>(
        '/account/notifications/'
      );
      if (res && res.notifications) {
        setNotifications(res.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const markAsRead = async (id: string, link?: string | null) => {
    try {
      await client.post(`/account/notifications/${id}/read/`, {});
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch {
      // Ignored
    }
    if (link) {
      navigate(link);
    }
  };

  const markAllAsRead = async () => {
    try {
      await client.post('/account/notifications/read-all/', {});
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch {
      // Fallback
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read_at;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadInbox} />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans">
      <PageHeader
        title="Candidate Inbox & Alerts"
        description="Official recruitment notices, interview schedules, and placement updates."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              leftIcon={<CheckCheck size={14} />}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeFilter === 'all'
              ? 'bg-ink text-white'
              : 'text-ink-muted hover:text-ink hover:bg-surface'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeFilter === 'unread'
              ? 'bg-ink text-white'
              : 'text-ink-muted hover:text-ink hover:bg-surface'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={activeFilter === 'unread' ? 'No unread notifications' : 'Your inbox is clear'}
          description="Official notifications from the placement office will appear here as drives progress."
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.read_at;

            return (
              <div
                key={notif.notification_id}
                onClick={() => markAsRead(notif.notification_id, notif.link)}
                className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isUnread
                    ? 'bg-surface border-brand/30 shadow-xs'
                    : 'bg-canvas/50 border-line hover:bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isUnread ? 'bg-now/20 text-now-ink font-bold' : 'bg-surface text-ink-muted border border-line'
                      }`}
                    >
                      <Bell size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-ink m-0 truncate">
                          {notif.title}
                        </h4>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-now shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-ink-secondary mt-1 m-0 leading-relaxed">
                        {notif.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-ink-muted">
                        <Clock size={11} />
                        <span>{formatRelative(notif.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {notif.link && (
                      <span className="text-xs text-brand font-medium flex items-center gap-1 hover:underline">
                        View <ArrowRight size={12} />
                      </span>
                    )}
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.notification_id);
                        }}
                        className="p-1 text-ink-muted hover:text-ink rounded"
                        title="Mark read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InboxPage;
