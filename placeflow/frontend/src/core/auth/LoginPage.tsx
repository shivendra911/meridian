import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Briefcase,
  GraduationCap,
  Users} from 'lucide-react';
import { useAuth } from './useAuth';
import { Logo } from '../../ui/Logo';

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
  const { login, status, me } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to nextUrl or default portal
  useEffect(() => {
    if (status === 'authed' && me) {
      if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('/login') && !nextUrl.startsWith('/forbidden')) {
        navigate(nextUrl, { replace: true });
      } else {
        const targetPortal = me.default_portal || (me.portals && me.portals[0]) || 'student';
        navigate(`/${targetPortal}/home`, { replace: true });
      }
    }
  }, [status, me, nextUrl, navigate]);

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
      const authUser = await login(userToLogin, passToLogin);

      // Determine redirection destination
      if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('/login') && !nextUrl.startsWith('/forbidden')) {
        navigate(nextUrl, { replace: true });
      } else {
        const targetPortal = authUser.default_portal || (authUser.portals && authUser.portals[0]) || 'student';
        navigate(`/${targetPortal}/home`, { replace: true });
      }
    } catch {
      // Standardized generic credentials message
      setErrorMsg('Invalid username or password.');
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
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row font-sans">
      {/* Left Brand Showcase Banner (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand via-brand-dark to-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background rings */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-brand-light/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <Link to="/">
            <Logo size="lg" />
          </Link>
          <div>
            <span className="font-bold text-lg tracking-tight block leading-tight">Meridian</span>
            <span className="text-xs text-white/70 block">Campus-to-Career OS</span>
          </div>
        </div>

        {/* Center Testimonial / Architecture Hero */}
        <div className="relative z-10 space-y-6 max-w-md my-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-xs border border-white/10">
            <Sparkles size={13} className="text-amber-300" />
            <span>Institutional Governance & Careers</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            One platform connecting students, faculty, and institutional leadership.
          </h1>
          <p className="text-sm text-white/80 leading-relaxed">
            Role-partitioned workspaces, real-time superday scheduling, automated NIRF analytics, and DPDP-compliant verification.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-white/60 shrink-0" />
              <div className="text-xs">
                <strong className="block text-white font-semibold">TPO Automation</strong>
                <span className="text-white/60">Live Superday</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-white/60 shrink-0" />
              <div className="text-xs">
                <strong className="block text-white font-semibold">Student Hub</strong>
                <span className="text-white/60">Verified Records</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-white/60 shrink-0" />
              <div className="text-xs">
                <strong className="block text-white font-semibold">Mentorship</strong>
                <span className="text-white/60">Faculty & HOD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/50 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Meridian Platform</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Column */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Brand Mark */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-block mb-2">
              <Logo size="lg" />
            </Link>
            <h2 className="text-xl font-bold text-ink">Meridian</h2>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              Sign in to your account
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Enter your university credentials or claimed account details.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Username, University ID or Email
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
                  placeholder="e.g. tpo_admin, student, or name@univ.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-surface text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ink">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand hover:text-brand-hover font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
                  className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-surface text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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

          {/* Self-Service Student Claim Link */}
          <div className="mt-6 pt-5 border-t border-line text-center">
            <p className="text-xs text-ink-muted">
              First time here as a student?{' '}
              <Link to="/claim" className="font-semibold text-brand hover:text-brand-hover transition-colors">
                Claim your account
              </Link>
            </p>
          </div>

          {/* Dev-Mode Demo Account Quick Selector */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-line">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-ink-muted flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={12} className="text-amber-500" />
                  Demo Workspaces
                </span>
                <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                  Dev Only
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickDemo(acc.username)}
                    className="p-1.5 text-left rounded-lg border border-line bg-canvas hover:bg-slate-100 hover:border-slate-300 transition-colors text-xs flex flex-col group cursor-pointer"
                  >
                    <span className="font-semibold text-ink group-hover:text-brand flex items-center justify-between text-xs">
                      {acc.label}
                      <span className="text-xs font-normal text-ink-muted font-mono">/{acc.portal}</span>
                    </span>
                    <span className="text-xs text-ink-muted truncate">{acc.name}</span>
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
