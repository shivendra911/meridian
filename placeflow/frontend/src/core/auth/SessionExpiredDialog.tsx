import React, { useState } from 'react';
import { ShieldAlert, Lock, ArrowRight, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from './useAuth';
import { formatApiError } from '../api/errors';

export const SessionExpiredDialog: React.FC = () => {
  const { sessionExpired, dismissSessionExpired, login, me } = useAuth();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!sessionExpired) return null;

  const username = me?.profile?.email || me?.account_id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await login(username, password);
      setPassword('');
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl ring-1 ring-black/10">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Session Expired</h3>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Your authentication session timed out. Re-authenticate to keep your current page and unsaved work intact.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Account
            </label>
            <input
              type="text"
              disabled
              value={username}
              className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink-muted font-mono cursor-not-allowed opacity-80"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <Lock size={15} />
              </div>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-surface text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={dismissSessionExpired}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Leave to sign in</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-hover transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Resume session</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
