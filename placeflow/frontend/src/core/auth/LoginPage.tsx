/**
 * PlaceFlow / Meridian — Login Page & Demo Persona Dispatcher (Phase 4).
 *
 * Implements authoritative session authentication and developer quick-select
 * for seeded demo accounts under development mode.
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { useAuth } from './useAuth';
import { formatApiError } from '../api/errors';

const DEMO_ACCOUNTS = [
  { username: 'student', label: 'Student', name: 'Aarav Sharma', role: 'STUDENT_MEMBER', portal: 'student' },
  { username: 'placement_rep', label: 'Placement Rep', name: 'Diya Patel', role: 'PLACEMENT_REP', portal: 'student' },
  { username: 'tpo_admin', label: 'TPO Head', name: 'Dr. K. Venkatesh', role: 'TPO_ADMIN', portal: 'tpo' },
  { username: 'faculty', label: 'Faculty Mentor', name: 'Dr. Janpreet Singh', role: 'FACULTY_MENTOR', portal: 'faculty' },
  { username: 'hod', label: 'Department Head', name: 'Dr. Sweety Sehgal', role: 'DEPARTMENT_HEAD', portal: 'hod' },
  { username: 'dean', label: 'Dean / HOS', name: 'Dr. Arun Malik', role: 'SCHOOL_HEAD', portal: 'hod' },
  { username: 'vice_chancellor', label: 'Vice Chancellor', name: 'Prof. Dr. P. K. Bansal', role: 'INSTITUTION_HEAD', portal: 'management' },
  { username: 'admin', label: 'Institution Admin', name: 'Platform Admin', role: 'INSTITUTION_ADMIN', portal: 'admin' },
];

export const LoginPage: React.FC = () => {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const userToLogin = customUser || username;
    const passToLogin = customPass || password;

    if (!userToLogin || !passToLogin) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const me = await login(userToLogin, passToLogin);
      
      // Determine redirection destination
      if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('/login') && !nextUrl.startsWith('/forbidden')) {
        navigate(nextUrl, { replace: true });
      } else {
        const targetPortal = me.default_portal || (me.portals && me.portals[0]) || 'student';
        navigate(`/${targetPortal}/home`, { replace: true });
      }
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (uname: string) => {
    setUsername(uname);
    setPassword('password123');
    handleSubmit(undefined, uname, 'password123');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Mark */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white font-bold text-xl mb-3 shadow-xs">
          M
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Sign in to Meridian
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Institutional Campus-to-Career Operating System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface py-8 px-6 sm:px-10 border border-line rounded-xl shadow-xs">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Username or University ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. tpo_admin, student, hod"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || status === 'loading'}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Dev-Mode Demo Account Quick Selector */}
          {import.meta.env.DEV && (
            <div className="mt-8 pt-6 border-t border-line">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-ink flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={12} className="text-amber-500" />
                  Seeded Demo Workspaces
                </span>
                <span className="text-[10px] text-ink-muted font-mono">Dev Only</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickDemo(acc.username)}
                    className="p-2 text-left rounded-lg border border-line bg-canvas hover:bg-slate-100 hover:border-slate-300 transition-colors text-xs flex flex-col group cursor-pointer"
                  >
                    <span className="font-semibold text-ink group-hover:text-brand flex items-center justify-between">
                      {acc.label}
                      <span className="text-[10px] font-normal text-ink-muted font-mono">/{acc.portal}</span>
                    </span>
                    <span className="text-[11px] text-ink-muted truncate mt-0.5">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

