import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { client } from '../../core/api/client';
import { formatRelative } from '../../ui/format';

interface NotificationItem {
  notification_id: string;
  kind: string;
  title: string;
  body: string;
  link?: string | null;
  created_at: string;
  read_at?: string | null;
}

export const NotificationsBell: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { me } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(me?.unread_notifications || 0);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnreadCount(me?.unread_notifications || 0);
  }, [me?.unread_notifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const res = await client.get<{ notifications: NotificationItem[]; unread_count: number }>(
        '/account/notifications/'
      );
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count ?? 0);
      }
    } catch {
      // Fallback
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await client.post('/account/notifications/read/', {});
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch {
      // Fail silent
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read_at) {
      try {
        await client.post('/account/notifications/read/', {
          notification_ids: [notif.notification_id],
        });
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notif.notification_id
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
      } catch {
        // Fail silent
      }
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  return (
    <div ref={bellRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 transition-colors"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border border-line bg-surface shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <Check size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-line">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-ink-muted">
                <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium m-0">No new notifications</p>
                <p className="text-xs text-slate-400 mt-0.5 m-0">
                  You're all caught up on placement activities.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notification_id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                    !n.read_at ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs ${!n.read_at ? 'font-semibold text-ink' : 'font-medium text-slate-700'} m-0 truncate`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-ink-muted shrink-0">
                      {formatRelative(n.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted line-clamp-2 m-0">
                    {n.body}
                  </p>
                  {n.link && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-brand">
                      <span>View details</span>
                      <ExternalLink size={10} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
