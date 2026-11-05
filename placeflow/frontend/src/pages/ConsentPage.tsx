import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ConsentRecord } from '../types';
import { Shield, CheckCircle, AlertCircle, Activity, XCircle } from 'lucide-react';

interface ConsentPageProps {
  initialStudentId?: string;
}

export const ConsentPage: React.FC<ConsentPageProps> = ({ initialStudentId = 'STU001' }) => {
  const [studentId, setStudentId] = useState(initialStudentId);
  const [inputSid, setInputSid] = useState(initialStudentId);
  const [loading, setLoading] = useState(true);
  const [candidateName, setCandidateName] = useState('');
  const [department, setDepartment] = useState('');
  const [mlOptOut, setMlOptOut] = useState(false);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const loadConsents = (sid: string) => {
    setLoading(true);
    setActionMsg(null);
    api
      .getConsents(sid)
      .then((res) => {
        setCandidateName(res.student_name);
        setDepartment(res.department);
        setMlOptOut(res.ml_opt_out);
        setConsents(res.consents);
        setLoading(false);
      })
      .catch((err) => {
        setActionMsg({ type: 'error', text: err.message });
        setLoading(false);
      });
  };

  useEffect(() => {
    loadConsents(studentId);
  }, [studentId]);

  const handleGrant = (purpose: string) => {
    api
      .recordConsent(studentId, purpose)
      .then(() => {
        setActionMsg({ type: 'success', text: `Explicit consent granted for ${purpose}.` });
        loadConsents(studentId);
      })
      .catch((err) => setActionMsg({ type: 'error', text: err.message }));
  };

  const handleWithdraw = (purpose: string) => {
    if (
      !window.confirm(
        `Are you sure you want to withdraw consent for ${purpose}? Predictive analytics or disclosures will immediately stop.`
      )
    ) {
      return;
    }
    api
      .withdrawConsent(studentId, purpose)
      .then(() => {
        setActionMsg({
          type: 'success',
          text: `Consent withdrawn for ${purpose}. ML opt-out active.`,
        });
        loadConsents(studentId);
      })
      .catch((err) => setActionMsg({ type: 'error', text: err.message }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-emerald-600 border border-slate-200 rounded p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            SECTION 13 &bull; DIGITAL PERSONAL DATA PROTECTION ACT (DPDP ACT 2023)
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            DPDP Purpose Consent &amp; Disclosure Ledger
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Granular, purpose-based candidate consent management (FR-PRV-001 &ndash; FR-PRV-003). Each data processing purpose requires explicit, informed, revocable consent with itemized field disclosures.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded text-xs font-semibold">
          <Shield size={13} className="text-emerald-600" />
          <span>Notice v2026.1-DPDP Active</span>
        </div>
      </div>

      {/* Candidate Selector Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStudentId(inputSid.trim().toUpperCase());
          }}
          className="flex items-center gap-3"
        >
          <span className="text-xs font-semibold text-slate-700">Candidate Roll:</span>
          <input
            type="text"
            value={inputSid}
            onChange={(e) => setInputSid(e.target.value)}
            placeholder="STU001"
            className="w-32 px-3 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-cardinal"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-navy-900 text-white text-xs font-semibold rounded hover:bg-navy-950"
          >
            Inspect Consents
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Quick Select:</span>
          {['STU001', 'STU002', 'STU003', 'STU004', 'STU005'].map((sid) => (
            <button
              key={sid}
              onClick={() => {
                setInputSid(sid);
                setStudentId(sid);
              }}
              className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium border ${
                studentId === sid
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sid}
            </button>
          ))}
        </div>
      </div>

      {/* Action Flash Alert */}
      {actionMsg && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 font-medium border ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle size={14} className="text-emerald-600" />
          ) : (
            <AlertCircle size={14} className="text-red-600" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Profile Snapshot Banner */}
      {!loading && candidateName && (
        <div className="bg-slate-50 border border-slate-200 rounded p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold font-serif text-slate-900">
              {candidateName} &bull; <span className="font-mono">{studentId}</span>
            </div>
            <div className="text-xs text-slate-500">{department} &bull; Enrolled Cohort 2025&ndash;26</div>
          </div>
          <div>
            {mlOptOut ? (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-semibold">
                ⚠️ ML Advisory: Opted Out
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold">
                ✓ ML Advisory: Active
              </span>
            )}
          </div>
        </div>
      )}

      {/* Purpose Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
          <Activity className="animate-spin mr-2" size={18} />
          Retrieving Purpose-Based Consent Records...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {consents.map((c) => {
            const isActive = c.status === 'ACTIVE' || c.status === 'GRANTED_BY_DEFAULT';
            return (
              <div
                key={c.purpose}
                className={`bg-white border rounded p-5 shadow-subtle flex flex-col justify-between ${
                  isActive ? 'border-emerald-500' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        c.is_mandatory
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {c.is_mandatory ? 'Mandatory for Drives' : 'Optional Consent'}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        isActive ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle size={13} className="text-emerald-600" />
                          <span>Active Consent</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} className="text-slate-400" />
                          <span>Withdrawn / Pending</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold font-serif text-slate-900 m-0 mb-1">
                    {c.purpose_title}
                  </h3>
                  <div className="text-[10.5px] font-mono text-slate-400 mb-2">
                    Code: {c.purpose}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{c.description}</p>

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-4">
                    <div className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      Disclosed Profile Attributes:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.disclosed_fields.map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10.5px] font-mono text-slate-800"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10.5px] text-slate-400 font-mono">
                    Notice: {c.notice_version}
                  </div>

                  {c.is_mandatory ? (
                    <span className="text-[11px] text-slate-400 italic">
                      Statutory Enrolment
                    </span>
                  ) : isActive ? (
                    <button
                      onClick={() => handleWithdraw(c.purpose)}
                      className="px-3 py-1 text-xs font-semibold text-red-700 hover:text-white bg-red-50 hover:bg-red-700 border border-red-200 rounded transition-colors"
                    >
                      Withdraw Consent
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGrant(c.purpose)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-950 rounded transition-colors"
                    >
                      Grant Explicit Consent
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DPDP Statutory Rights Box */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle space-y-3">
        <h3 className="text-sm font-bold font-serif text-slate-900 m-0">
          Digital Personal Data Protection (DPDP) Act 2023 Statutory Rights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div>
            <strong className="text-slate-900 block mb-1">§11 Itemized Notice:</strong>
            Students receive prior notice detailing processing purposes and specific data attributes before recruiter intake.
          </div>
          <div>
            <strong className="text-slate-900 block mb-1">§12 Correction &amp; Erasure:</strong>
            Right to update academic metrics or request archival of expired resumes and application transcripts.
          </div>
          <div>
            <strong className="text-slate-900 block mb-1">§14 Easy Withdrawal:</strong>
            Optional consents may be revoked at any time. Withdrawal immediately purges candidate records from active inference caches.
          </div>
        </div>
      </div>
    </div>
  );
};

