import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  CheckCheck,
  ExternalLink,
  Clock} from 'lucide-react';
import { client } from '../../core/api/client';
import { useAuth } from '../../core/auth/useAuth';
import { formatRelative } from '../../ui/format';
import { formatApiError } from '../../core/api/errors';

interface NotificationItem {
  notification_id: string;
  kind?: string;
  title: string;
  body: string;
  link?: string;
  created_at: string;
  read_at?: string | null;
}

export const AccountNotificationsPage: React.FC = () => {
  const { refreshMe } = useAuth();

  // Notification Preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  // Notifications History
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [profRes, notifRes] = await Promise.all([
          client.get<any>('/account/profile/'),
          client.get<{ notifications: NotificationItem[] }>('/account/notifications/'),
        ]);

        if (isMounted) {
          if (profRes.notification_prefs) {
            setEmailNotifs(Boolean(profRes.notification_prefs.email));
            setInAppNotifs(Boolean(profRes.notification_prefs.in_app));
          }
          setNotifications(notifRes.notifications || []);
        }
      } catch (err) {
        console.warn('Failed loading notifications data:', err);
      } finally {
        if (isMounted) setLoadingNotifs(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsError(null);
    setPrefsSuccess(null);

    try {
      await client.patch('/account/profile/', {
        notification_prefs: {
          email: emailNotifs,
          in_app: inAppNotifs,
        },
      });
      setPrefsSuccess('Notification preferences updated.');
      await refreshMe();
      setTimeout(() => setPrefsSuccess(null), 4000);
    } catch (err) {
      setPrefsError(formatApiError(err));
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await client.post('/account/notifications/read/', { all: true });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      await refreshMe();
    } catch (err) {
      console.warn('Failed marking notifications read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-8">
      {/* 1. Notification Preferences Card */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <div className="border-b border-line pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Channel Preferences</h2>
              <p className="text-xs text-ink-muted">
                Control where and how you receive placement announcements, drive invitations, and updates.
              </p>
            </div>
          </div>
        </div>

        {prefsSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{prefsSuccess}</span>
          </div>
        )}

        {prefsError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{prefsError}</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-4 max-w-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-line bg-canvas">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-200 text-slate-700 mt-0.5">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-ink block">Email Notifications</span>
                  <span className="text-xs text-ink-muted leading-relaxed block mt-0.5">
                    Critical recruitment announcements, shortlisted interview slots, and official offer letters sent to your institutional inbox.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 rounded border-line text-brand focus:ring-brand cursor-pointer ml-4"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-line bg-canvas">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-200 text-slate-700 mt-0.5">
                  <Bell size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-ink block">In-App Notifications</span>
                  <span className="text-xs text-ink-muted leading-relaxed block mt-0.5">
                    Real-time alerts in the top bar navigation bell, actionable tasks, and advisor feedback notifications.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={inAppNotifs}
                onChange={(e) => setInAppNotifs(e.target.checked)}
                className="w-4 h-4 rounded border-line text-brand focus:ring-brand cursor-pointer ml-4"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPrefs}
              className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {savingPrefs ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save preferences</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Notifications History Inbox */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-ink">Notifications History</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              disabled={markingAll}
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-canvas hover:bg-slate-100 text-xs font-semibold text-ink transition-colors cursor-pointer"
            >
              <CheckCheck size={14} className="text-brand" />
              <span>{markingAll ? 'Updating...' : 'Mark all as read'}</span>
            </button>
          )}
        </div>

        {loadingNotifs ? (
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-ink">Inbox is clean</p>
            <p className="text-xs text-ink-muted mt-0.5">You have no notification events to display.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item) => {
              const isUnread = !item.read_at;

              return (
                <div
                  key={item.notification_id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isUnread
                      ? 'border-brand/30 bg-brand/5'
                      : 'border-line bg-canvas hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-ink m-0">{item.title}</h4>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed m-0">
                        {item.body}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-ink-muted flex items-center gap-1">
                        <Clock size={11} />
                        {formatRelative(item.created_at)}
                      </span>
                      {item.link && (
                        <a
                          href={item.link}
                          className="p-1 rounded hover:bg-slate-200 text-brand"
                          title="View event"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
