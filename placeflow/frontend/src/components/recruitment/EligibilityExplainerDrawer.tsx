import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Building2,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { SlideOverDrawer } from '../ui/SlideOverDrawer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface EligibilityCriterion {
  ruleName: string;
  requirement: string;
  studentValue: string;
  isSatisfied: boolean;
  isMissingData?: boolean;
  notes?: string;
}

export interface EligibilityReport {
  studentId: string;
  studentName: string;
  department: string;
  batch: string;
  companyName: string;
  jobTitle: string;
  overallStatus: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'DATA_INCOMPLETE';
  policyVersion: string;
  evaluatedAt: string;
  criteria: EligibilityCriterion[];
  overridePermitted: boolean;
}

interface EligibilityExplainerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: EligibilityReport | null;
  onRequestOverride?: (studentId: string, ruleName: string) => void;
}

export const EligibilityExplainerDrawer: React.FC<EligibilityExplainerDrawerProps> = ({
  isOpen,
  onClose,
  report,
  onRequestOverride,
}) => {
  if (!report) return null;

  const isEligible = report.overallStatus === 'ELIGIBLE';
  const isIncomplete = report.overallStatus === 'DATA_INCOMPLETE';

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Eligibility Evaluation Details"
      subtitle={`${report.studentName} (${report.studentId}) — ${report.companyName}`}
      width="lg"
    >
      <div className="space-y-6">
        {/* Status Hero Ribbon */}
        <div
          className={`p-4 rounded-lg border flex items-start gap-3.5 ${
            isEligible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : isIncomplete
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-red-50 border-red-200 text-red-950'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {isEligible ? (
              <CheckCircle2 size={24} className="text-emerald-600" />
            ) : isIncomplete ? (
              <AlertTriangle size={24} className="text-amber-600" />
            ) : (
              <XCircle size={24} className="text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider font-mono">
                {report.overallStatus.replace('_', ' ')}
              </span>
              <Badge
                variant={isEligible ? 'success' : isIncomplete ? 'warning' : 'destructive'}
                size="xs"
              >
                Deterministic Evaluation
              </Badge>
            </div>
            <p className="text-xs mt-1 leading-relaxed">
              {isEligible
                ? `Candidate meets all institutional policy and corporate eligibility requirements for ${report.jobTitle}.`
                : isIncomplete
                ? 'Candidate eligibility cannot be certified due to missing statutory academic records or DPDP consent attestations.'
                : `Candidate does not satisfy 1 or more mandatory conditions specified by ${report.companyName}.`}
            </p>
          </div>
        </div>

        {/* Opportunity & Candidate Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-500 block mb-0.5 font-medium">Position / Role</span>
            <span className="font-semibold text-slate-800">{report.jobTitle}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5 font-medium">Recruiting Partner</span>
            <span className="font-semibold text-slate-800">{report.companyName}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5 font-medium">Department & Batch</span>
            <span className="font-semibold text-slate-800">
              {report.department} ({report.batch})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5 font-medium">Evaluation Timestamp</span>
            <span className="font-semibold text-slate-800 font-mono text-[11px]">
              {report.evaluatedAt}
            </span>
          </div>
        </div>

        {/* Deterministic Criteria Breakdown (Section 6.4) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Evaluation Criteria & Rules Breakdown
            </h4>
            <span className="text-[11px] text-slate-400">
              {report.criteria.filter((c) => c.isSatisfied).length} / {report.criteria.length} passed
            </span>
          </div>

          <div className="space-y-2.5">
            {report.criteria.map((criterion, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  criterion.isSatisfied
                    ? 'bg-white border-slate-200'
                    : criterion.isMissingData
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-red-50/50 border-red-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {criterion.isSatisfied ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : criterion.isMissingData ? (
                      <HelpCircle size={16} className="text-amber-600 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-600 shrink-0" />
                    )}
                    <span className="font-bold text-slate-900">{criterion.ruleName}</span>
                  </div>

                  <Badge
                    variant={
                      criterion.isSatisfied
                        ? 'success'
                        : criterion.isMissingData
                        ? 'warning'
                        : 'destructive'
                    }
                    size="xs"
                  >
                    {criterion.isSatisfied
                      ? 'Matched'
                      : criterion.isMissingData
                      ? 'Missing Data'
                      : 'Failed'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Required:</span>
                    <span className="font-medium text-slate-700">{criterion.requirement}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Candidate Record:</span>
                    <span
                      className={`font-mono font-semibold ${
                        criterion.isSatisfied
                          ? 'text-emerald-700'
                          : criterion.isMissingData
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {criterion.studentValue}
                    </span>
                  </div>
                </div>

                {criterion.notes && (
                  <p className="text-[11px] text-slate-500 mt-1.5 italic bg-slate-50 p-1.5 rounded">
                    {criterion.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Policy Governance & Cryptographic Provenance */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ShieldCheck size={14} className="text-[#8C1515]" />
            Policy Engine Provenance
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Evaluated under <strong>{report.policyVersion}</strong>. Results are calculated directly against authoritative registrar records with zero manual tampering.
          </p>
        </div>

        {/* TPO Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspection
          </Button>
          {report.overridePermitted && !isEligible && (
            <Button
              variant="cardinal"
              size="sm"
              onClick={() => onRequestOverride?.(report.studentId, 'Placement Committee Special Waiver')}
            >
              Request Committee Waiver
            </Button>
          )}
        </div>
      </div>
    </SlideOverDrawer>
  );
};

