import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Camera,
  UploadCloud,
  Bell,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  AlertCircle} from 'lucide-react';
import { useAuth } from './useAuth';
import { client } from '../api/client';
import { Avatar } from '../../ui/cards/Avatar';
import { formatApiError } from '../api/errors';
import { toast } from 'sonner';

type OnboardingStep = 1 | 2 | 3 | 4;

export const OnboardingPage: React.FC = () => {
  const { me, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 2 Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Step 3 Consent state
  const [consentPlacement, setConsentPlacement] = useState(true);
  const [consentRecruiters, setConsentRecruiters] = useState(true);

  // Step 4 Notification prefs
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  // Load composed profile
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await client.get<any>('/account/profile/');
        if (isMounted) {
          setProfileData(data);
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
          if (data.notification_prefs) {
            setEmailNotifs(Boolean(data.notification_prefs.email));
            setInAppNotifs(Boolean(data.notification_prefs.in_app));
          }
        }
      } catch (err) {
        console.warn('Failed loading profile for onboarding:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image file size exceeds the 2 MB limit.');
      return;
    }
    setErrorMsg(null);
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    await client.post('/account/avatar/', formData);
  };

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Upload avatar if selected
      if (avatarFile) {
        try {
          await handleUploadAvatar();
        } catch (avErr) {
          console.warn('Avatar upload warning during onboarding:', avErr);
        }
      }

      // 2. Record DPDP Consents if student
      const studentId = me?.subject?.id;
      if (studentId) {
        try {
          if (consentPlacement) {
            await client.post('/consent/record/', {
              student_id: studentId,
              purpose: 'PLACEMENT_COORDINATION',
              consent_given: true,
            });
          }
          if (consentRecruiters) {
            await client.post('/consent/record/', {
              student_id: studentId,
              purpose: 'RECRUITER_VISIBILITY',
              consent_given: true,
            });
          }
        } catch (consentErr) {
          console.warn('Consent recording warning:', consentErr);
        }
      }

      // 3. Update notification preferences and mark onboarded_at
      await client.patch('/account/profile/', {
        notification_prefs: {
          email: emailNotifs,
          in_app: inAppNotifs,
        },
        onboarded_at: new Date().toISOString(),
      });

      // 4. Refresh auth state
      await refreshMe();

      // 5. Navigate to user's home workspace
      const targetPortal = me?.default_portal || (me?.portals && me.portals[0]) || 'student';
      navigate(`/${targetPortal}/home`, { replace: true });
    } catch (err) {
      setErrorMsg(formatApiError(err));
      setIsSubmitting(false);
    }
  };

  const primaryAff = profileData?.affiliations?.[0];
  const official = primaryAff?.official_data || {};
  const displayName = profileData?.display_name || me?.display_name || 'Member';

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-ink-muted">Loading onboarding experience...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto w-full">
        {/* Brand & Stepper Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white font-bold text-xl mb-3 shadow-xs">
            M
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Welcome to Meridian
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Let's configure your workspace in four quick steps.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {[
              { num: 1, label: 'Official Record' },
              { num: 2, label: 'Profile Photo' },
              { num: 3, label: 'Privacy & DPDP' },
              { num: 4, label: 'Notifications' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-full text-xs font-semibold px-2.5 py-0.5 transition-colors ${
                    step === s.num
                      ? 'bg-brand text-white shadow-xs'
                      : step > s.num
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}. {s.label}
                </span>
                {s.num < 4 && <span className="text-slate-300 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-surface rounded-2xl border border-line p-6 sm:p-8 shadow-xs">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: VERIFIED OFFICIAL RECORD */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-line pb-4">
                <div className="flex items-center gap-2 text-brand">
                  <ShieldCheck size={20} />
                  <h2 className="text-sm font-bold text-ink">Confirm Verified Details</h2>
                </div>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  The institution has provisioned your authoritative identity. Review your official data below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl border border-line bg-canvas">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                    Full Name (As on Record)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">{displayName}</span>
                    <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-teal-700 border border-teal-200">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-line bg-canvas">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                    Registration No / Roll No
                  </span>
                  <span className="text-xs font-bold text-ink font-mono">
                    {official.reg_no || me?.subject?.id || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-line bg-canvas">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                    Academic Department
                  </span>
                  <span className="text-xs font-bold text-ink">
                    {official.department || profileData?.department || 'Computer Science & Engineering'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-line bg-canvas">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                    Batch / Graduation Year
                  </span>
                  <span className="text-xs font-bold text-ink">
                    {official.batch || 'Batch of 2026'}
                  </span>
                </div>

                {official.cgpa && (
                  <div className="p-3 rounded-xl border border-line bg-canvas">
                    <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                      Official CGPA
                    </span>
                    <span className="text-xs font-bold text-ink font-mono">
                      {official.cgpa} / 10.0
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-xl border border-line bg-canvas">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                    Institutional Email
                  </span>
                  <span className="text-xs font-bold text-ink">
                    {profileData?.primary_email || me?.profile?.email || '—'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-line text-xs text-ink-muted flex items-center justify-between">
                <span>Noticed an inaccuracy in your official academic records?</span>
                <button
                  type="button"
                  onClick={() => toast.info('Official record corrections can be requested in Account > Privacy & Data Rights.')}
                  className="font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Request correction</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Confirm and continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE PHOTO */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-line pb-4">
                <div className="flex items-center gap-2 text-brand">
                  <Camera size={20} />
                  <h2 className="text-sm font-bold text-ink">Add Profile Photo</h2>
                </div>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  Your photo helps recruiters, faculty mentors, and peers recognize you across campus portals.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
                <Avatar
                  src={avatarPreview}
                  name={displayName}
                  size={96}
                  className="ring-4 ring-slate-100 shadow-sm"
                />

                <div className="flex-1 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink hover:bg-slate-100 transition-colors cursor-pointer shadow-xs">
                    <UploadCloud size={16} className="text-brand" />
                    <span>Choose image file</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </label>
                  <p className="mt-2 text-xs text-ink-muted">
                    Supports PNG, JPG, or WEBP up to 2 MB. Square aspect ratio recommended.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink rounded-lg transition-colors cursor-pointer"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Save & Continue</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRIVACY & DPDP CONSENT */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-line pb-4">
                <div className="flex items-center gap-2 text-brand">
                  <Lock size={20} />
                  <h2 className="text-sm font-bold text-ink">Privacy & DPDP Consent</h2>
                </div>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  In compliance with the Digital Personal Data Protection (DPDP) Act, please review how your placement data is handled.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-canvas hover:bg-slate-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentPlacement}
                    onChange={(e) => setConsentPlacement(e.target.checked)}
                    className="mt-1 rounded border-line text-brand focus:ring-brand"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Placement Coordination & Eligibility Processing
                    </span>
                    <span className="text-xs text-ink-muted leading-relaxed block mt-0.5">
                      Permits the Training & Placement Cell to verify criteria, compute academic eligibility cutoffs, and schedule recruitment rounds.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-canvas hover:bg-slate-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentRecruiters}
                    onChange={(e) => setConsentRecruiters(e.target.checked)}
                    className="mt-1 rounded border-line text-brand focus:ring-brand"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Corporate Recruiter Visibility
                    </span>
                    <span className="text-xs text-ink-muted leading-relaxed block mt-0.5">
                      Allows authorized partner companies with active placement drives to review your submitted dossiers, resumes, and interview schedules.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: NOTIFICATIONS & FINISH */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-line pb-4">
                <div className="flex items-center gap-2 text-brand">
                  <Bell size={20} />
                  <h2 className="text-sm font-bold text-ink">Notification Preferences</h2>
                </div>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  Stay informed about upcoming placement drives, application status updates, and interview slots.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-canvas">
                  <div>
                    <span className="text-xs font-bold text-ink block">Email Notifications</span>
                    <span className="text-xs text-ink-muted block mt-0.5">
                      Receive critical drive invitations, shortlist announcements, and offer letters.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="w-4 h-4 rounded border-line text-brand focus:ring-brand cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-canvas">
                  <div>
                    <span className="text-xs font-bold text-ink block">In-App Notifications</span>
                    <span className="text-xs text-ink-muted block mt-0.5">
                      Real-time alerts in the top bar bell icon for interviews, tasks, and advisor notes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={inAppNotifs}
                    onChange={(e) => setInAppNotifs(e.target.checked)}
                    className="w-4 h-4 rounded border-line text-brand focus:ring-brand cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-brand/5 to-teal-500/5 border border-brand/20 flex items-start gap-3">
                <Sparkles size={20} className="text-brand shrink-0 mt-0.5" />
                <div className="text-xs text-ink-muted leading-relaxed">
                  <span className="font-semibold text-ink">You're ready to launch:</span> Your personalized dashboard and campus-to-career tools are unlocked.
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteOnboarding}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-5 py-2.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Completing setup...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete setup & enter workspace</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
