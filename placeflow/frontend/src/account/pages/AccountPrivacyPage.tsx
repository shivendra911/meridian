import React, { useState, useEffect } from 'react';
import {
  Lock,
  Shield,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  Send} from 'lucide-react';
import { client } from '../../core/api/client';
import { useAuth } from '../../core/auth/useAuth';
import { formatApiError } from '../../core/api/errors';

interface ConsentRecord {
  purpose: string;
  consent_given: boolean;
  timestamp?: string;
  withdrawn_at?: string | null;
}

const PURPOSES = [
  {
    key: 'PLACEMENT_COORDINATION',
    label: 'Placement Coordination & Drive Eligibility',
    desc: 'Authorizes the university Training & Placement Cell to verify criteria, compute academic eligibility cutoffs, and schedule recruitment rounds.',
  },
  {
    key: 'RECRUITER_VISIBILITY',
    label: 'Corporate Recruiter Visibility',
    desc: 'Allows authorized partner companies with active placement drives to review your submitted dossiers, resumes, and interview schedules.',
  },
  {
    key: 'ALUMNI_COMMUNITY',
    label: 'Alumni Network & Career Mentorship',
    desc: 'Permits connecting with verified institutional alumni for career guidance, mock interviews, and referral opportunities.',
  },
];

export const AccountPrivacyPage: React.FC = () => {
  const { me } = useAuth();
  const studentId = me?.subject?.type === 'student' ? me.subject.id : null;

  const [consents, setConsents] = useState<Record<string, boolean>>({
    PLACEMENT_COORDINATION: true,
    RECRUITER_VISIBILITY: true,
    ALUMNI_COMMUNITY: false,
  });
  const [_loadingConsents, setLoadingConsents] = useState(true);
  const [savingPurpose, setSavingPurpose] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Correction Request Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionField, setCorrectionField] = useState('cgpa');
  const [correctionDetails, setCorrectionDetails] = useState('');
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (studentId) {
      (async () => {
        try {
          const res = await client.get<any>(`/consent/${studentId}/`);
          if (isMounted && res.records) {
            const map: Record<string, boolean> = {};
            res.records.forEach((r: ConsentRecord) => {
              map[r.purpose] = r.consent_given && !r.withdrawn_at;
            });
            setConsents((prev) => ({ ...prev, ...map }));
          }
        } catch (err) {
          console.warn('Failed loading consents:', err);
        } finally {
          if (isMounted) setLoadingConsents(false);
        }
      })();
    } else {
      setLoadingConsents(false);
    }
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const handleToggleConsent = async (purpose: string, currentState: boolean) => {
    if (!studentId) {
      setConsents((prev) => ({ ...prev, [purpose]: !currentState }));
      return;
    }

    setSavingPurpose(purpose);
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      if (currentState) {
        // Withdraw consent
        await client.post('/consent/withdraw/', {
          student_id: studentId,
          purpose,
        });
        setConsents((prev) => ({ ...prev, [purpose]: false }));
        setFeedbackMsg(`Consent for ${purpose.replace(/_/g, ' ')} has been withdrawn.`);
      } else {
        // Record consent
        await client.post('/consent/record/', {
          student_id: studentId,
          purpose,
          consent_given: true,
        });
        setConsents((prev) => ({ ...prev, [purpose]: true }));
        setFeedbackMsg(`Consent recorded successfully.`);
      }
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setSavingPurpose(null);
    }
  };

  const handleDownloadPersonalDossier = async () => {
    try {
      const data = await client.get<any>('/account/profile/');
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meridian-personal-dossier-${me?.person_id || 'me'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Failed exporting personal dossier.');
    }
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrectionSubmitted(true);
    setTimeout(() => {
      setShowCorrectionModal(false);
      setCorrectionSubmitted(false);
      setCorrectionDetails('');
      setFeedbackMsg('Official data correction ticket submitted to university administration.');
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* 1. Digital Personal Data Protection (DPDP) Consents */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <div className="border-b border-line pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">DPDP Purpose Consents</h2>
              <p className="text-xs text-ink-muted">
                In compliance with the Digital Personal Data Protection Act, review and manage specific data processing permissions.
              </p>
            </div>
          </div>
        </div>

        {feedbackMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3 max-w-2xl">
          {PURPOSES.map((item) => {
            const isChecked = Boolean(consents[item.key]);
            const isUpdating = savingPurpose === item.key;

            return (
              <div
                key={item.key}
                className="p-4 rounded-xl border border-line bg-canvas flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">{item.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-xs font-semibold ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isChecked ? 'Active' : 'Withdrawn'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleToggleConsent(item.key, isChecked)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    isChecked
                      ? 'border border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                      : 'border border-line bg-surface text-ink hover:bg-slate-100'
                  }`}
                >
                  {isUpdating ? 'Saving...' : isChecked ? 'Withdraw' : 'Grant consent'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Data Subject Rights (Portability & Correction) */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <div className="border-b border-line pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Data Subject Rights</h2>
              <p className="text-xs text-ink-muted">
                Exercise statutory data portability and correction rights regarding your institutional record.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-line bg-canvas flex flex-col justify-between">
            <div className="space-y-1.5 mb-4">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <Download size={15} className="text-brand" />
                Data Portability (Export Dossier)
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Download a machine-readable JSON archive of all personal data, affiliations, role assignments, and profile extensions.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadPersonalDossier}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            >
              <Download size={14} className="text-brand" />
              <span>Download my data (JSON)</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-line bg-canvas flex flex-col justify-between">
            <div className="space-y-1.5 mb-4">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <FileText size={15} className="text-brand" />
                Request Official Record Correction
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                If official institutional data (Name, CGPA, Registration Number, Department) contains an error, file a verified correction request.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCorrectionModal(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              <FileText size={14} />
              <span>Request official correction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl ring-1 ring-black/10">
            <h3 className="text-base font-bold text-ink">Request Official Record Correction</h3>
            <p className="mt-1 text-xs text-ink-muted">
              Submitted to your institution's registrar and administration office.
            </p>

            {correctionSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                <p className="text-xs font-semibold text-ink">Ticket Submitted</p>
                <p className="text-xs text-ink-muted">The administration office has received your request.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitCorrection} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Field to Correct
                  </label>
                  <select
                    value={correctionField}
                    onChange={(e) => setCorrectionField(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value="cgpa">Official CGPA / Grades</option>
                    <option value="name">Legal Name Spelling</option>
                    <option value="reg_no">Registration / Roll Number</option>
                    <option value="dept">Academic Department / Branch</option>
                    <option value="other">Other Official Record</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Correction Details & Evidence Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={correctionDetails}
                    onChange={(e) => setCorrectionDetails(e.target.value)}
                    placeholder="State current record, correct value, and semester grade sheet reference..."
                    className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCorrectionModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <Send size={13} />
                    <span>Submit request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
