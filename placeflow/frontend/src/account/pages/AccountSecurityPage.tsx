import React, { useState, useEffect } from 'react';
import {
  Key,
  Laptop,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Clock} from 'lucide-react';
import { client } from '../../core/api/client';
import { accountApi } from '../api';
import { formatRelative, formatDateTime } from '../../ui/format';
import { formatApiError } from '../../core/api/errors';

interface SessionItem {
  session_id: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
  last_active_at?: string;
  is_current?: boolean;
}

export const AccountSecurityPage: React.FC = () => {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [sessSuccess, setSessSuccess] = useState<string | null>(null);
  const [sessError, setSessError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      const data = await accountApi.getSessions();
      setSessions(data || []);
    } catch (err) {
      setSessError(formatApiError(err));
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setPwdError(null);
    setPwdSuccess(null);

    try {
      await client.post('/account/password/change/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwdSuccess('Password changed successfully. All other active sessions have been invalidated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await loadSessions();
      setTimeout(() => setPwdSuccess(null), 5000);
    } catch (err) {
      setPwdError(formatApiError(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    setSessError(null);
    try {
      await client.delete(`/account/sessions/${sessionId}/`);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      setSessSuccess('Session terminated.');
      setTimeout(() => setSessSuccess(null), 3000);
    } catch (err) {
      setSessError(formatApiError(err));
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to log out all other devices and browsers?')) return;

    setRevokingAll(true);
    setSessError(null);
    try {
      await client.post('/account/sessions/revoke-others/');
      setSessions((prev) => prev.filter((s) => s.is_current));
      setSessSuccess('All other sessions terminated successfully.');
      setTimeout(() => setSessSuccess(null), 3000);
    } catch (err) {
      setSessError(formatApiError(err));
    } finally {
      setRevokingAll(false);
    }
  };

  const parseBrowser = (ua?: string): string => {
    if (!ua) return 'Web Browser';
    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Safari')) return 'Apple Safari';
    if (ua.includes('Edge')) return 'Microsoft Edge';
    return 'Desktop Browser';
  };

  return (
    <div className="space-y-8">
      {/* 1. Change Password Section */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <div className="border-b border-line pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Change Password</h2>
              <p className="text-xs text-ink-muted">
                Update your account password. Changing your password automatically logs out other devices.
              </p>
            </div>
          </div>
        </div>

        {pwdSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{pwdSuccess}</span>
          </div>
        )}

        {pwdError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <Lock size={14} />
              </div>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              New Password (min. 8 characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <Key size={14} />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <Key size={14} />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {savingPassword ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span>Update password</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Active Sessions Section */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Laptop size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Active Sessions</h2>
              <p className="text-xs text-ink-muted">
                Devices and browsers currently authenticated to your account.
              </p>
            </div>
          </div>

          {sessions.filter((s) => !s.is_current).length > 0 && (
            <button
              type="button"
              disabled={revokingAll}
              onClick={handleRevokeAllOtherSessions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-60"
            >
              <LogOut size={13} />
              <span>{revokingAll ? 'Revoking...' : 'Revoke all other sessions'}</span>
            </button>
          )}
        </div>

        {sessSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{sessSuccess}</span>
          </div>
        )}

        {sessError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{sessError}</span>
          </div>
        )}

        {loadingSessions ? (
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-ink-muted">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => {
              const isCurrent = sess.is_current;
              const browser = parseBrowser(sess.user_agent);

              return (
                <div
                  key={sess.session_id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isCurrent
                      ? 'border-brand/30 bg-brand/5'
                      : 'border-line bg-canvas hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-lg mt-0.5 ${isCurrent ? 'bg-brand/10 text-brand' : 'bg-slate-200 text-slate-600'}`}>
                      <Laptop size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">{browser}</span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold">
                            This device
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                        {sess.ip && <span className="font-mono">{sess.ip}</span>}
                        {sess.last_active_at && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            Active {formatRelative(sess.last_active_at)}
                          </span>
                        )}
                        <span>Created {formatDateTime(sess.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      disabled={revokingId === sess.session_id}
                      onClick={() => handleRevokeSession(sess.session_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-ink-muted hover:text-red-700 hover:border-red-200 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-60"
                      title="Terminate this session"
                    >
                      <Trash2 size={13} />
                      <span>{revokingId === sess.session_id ? 'Revoking...' : 'Revoke'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
