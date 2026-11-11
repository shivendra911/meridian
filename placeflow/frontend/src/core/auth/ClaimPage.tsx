import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Mail,
  Hash,
} from 'lucide-react';
import { client } from '../api/client';
import { formatApiError } from '../api/errors';

type ClaimStep = 'IDENTIFY' | 'VERIFY_OTP' | 'SET_PASSWORD' | 'SUCCESS';

export const ClaimPage: React.FC = () => {
  const [step, setStep] = useState<ClaimStep>('IDENTIFY');
  const [regNo, setRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [claimId, setClaimId] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Step 1: Request claim OTP
  const handleStartClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim() || !email.trim()) {
      setErrorMsg('Please enter both your registration number and institutional email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await client.post<{ message: string; claim_id: string }>('/auth/claim/start/', {
        registration_no: regNo.trim(),
        institutional_email: email.trim().toLowerCase(),
      });
      setClaimId(res.claim_id);
      setInfoMsg(res.message);
      setStep('VERIFY_OTP');
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Validate OTP locally before setting password
  const handleProceedToPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }
    setErrorMsg(null);
    setStep('SET_PASSWORD');
  };

  // Step 3: Complete verification and account provisioning
  const handleVerifyClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await client.post('/auth/claim/verify/', {
        claim_id: claimId,
        otp: otp.trim(),
        password,
      });
      setStep('SUCCESS');
    } catch (err: any) {
      const msg = formatApiError(err);
      if (err?.payload?.locked) {
        setErrorMsg('Too many invalid attempts. This claim request has been locked for security. Please contact administration.');
      } else if (err?.payload?.expired) {
        setErrorMsg('Verification code expired. Please start over.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white font-bold text-xl mb-3 shadow-xs">
          M
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Claim Student Account
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Activate your pre-registered university record with one-time verification.
        </p>

        {/* Step Indicator */}
        {step !== 'SUCCESS' && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {[
              { id: 'IDENTIFY', label: '1. Identity' },
              { id: 'VERIFY_OTP', label: '2. Verify Code' },
              { id: 'SET_PASSWORD', label: '3. Password' },
            ].map((s, idx) => {
              const isActive = step === s.id;
              const isDone =
                (step === 'VERIFY_OTP' && idx === 0) ||
                (step === 'SET_PASSWORD' && (idx === 0 || idx === 1));

              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand text-white'
                        : isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < 2 && <span className="text-slate-300 text-xs">→</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface py-8 px-6 sm:px-10 border border-line rounded-xl shadow-xs">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: IDENTIFY */}
          {step === 'IDENTIFY' && (
            <form onSubmit={handleStartClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Registration Number / Student ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Hash size={15} />
                  </div>
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="e.g. STU100001 or 12104567"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Institutional Email on Record
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-muted">
                  A 6-digit code will be dispatched to your university email.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching records...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Already have an account? Sign in</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 'VERIFY_OTP' && (
            <form onSubmit={handleProceedToPassword} className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
                {infoMsg || 'If your record matches, a 6-digit code was sent to your email.'}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <KeyRound size={15} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-base tracking-widest text-center border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono font-bold"
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Code expires in 10 minutes. 5 attempts permitted.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFY')}
                  className="w-1/3 py-2 px-3 rounded-lg border border-line bg-canvas text-ink-muted hover:text-ink text-xs font-semibold transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className="w-2/3 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  <span>Verify code</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SET PASSWORD */}
          {step === 'SET_PASSWORD' && (
            <form onSubmit={handleVerifyClaim} className="space-y-4">
              <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-brand shrink-0 mt-0.5" />
                <div className="text-[11px] text-ink-muted leading-relaxed">
                  Verification code confirmed. Choose a password to finalize activating your student account.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Password (min. 8 characters)
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
                    className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Lock size={15} />
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('VERIFY_OTP')}
                  className="w-1/3 py-2 px-3 rounded-lg border border-line bg-canvas text-ink-muted hover:text-ink text-xs font-semibold transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete claim</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-semibold text-ink">Account Claimed Successfully!</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Your student account has been provisioned and your verified affiliation is confirmed. You can now log in to access your placement opportunities.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Sign in to your student workspace</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
