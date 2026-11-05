import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
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
      <div className="space-y-6 font-sans">
        {/* Status Hero Ribbon */}
        <div
          className={`p-4 rounded-lg border flex items-start gap-3.5 ${
            isEligible
              ? 'bg-emerald-50 border-emerald-200 text-ink'
              : isIncomplete
              ? 'bg-amber-50 border-amber-200 text-ink'
              : 'bg-red-50 border-red-200 text-ink'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {isEligible ? (
              <CheckCircle2 size={20} className="text-success" />
            ) : isIncomplete ? (
              <AlertTriangle size={20} className="text-warning" />
            ) : (
              <XCircle size={20} className="text-danger" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                {report.overallStatus.replace('_', ' ')}
              </span>
              <Badge
                variant={isEligible ? 'success' : isIncomplete ? 'warning' : 'destructive'}
                size="xs"
              >
                Deterministic Result
              </Badge>
            </div>
            <p className="text-xs mt-1 leading-relaxed text-ink-muted m-0">
              {isEligible
                ? `Candidate meets all institutional placement charter conditions and recruiter eligibility criteria for ${report.jobTitle}.`
                : isIncomplete
                ? 'Candidate eligibility cannot be certified due to missing academic transcripts or DPDP Act consent attestations.'
                : `Candidate does not satisfy 1 or more mandatory conditions specified by ${report.companyName}.`}
            </p>
          </div>
        </div>

        {/* Opportunity & Candidate Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-canvas p-3.5 rounded-lg border border-line">
          <div>
            <span className="text-ink-muted block mb-0.5 font-medium">Position / Role</span>
            <span className="font-semibold text-ink">{report.jobTitle}</span>
          </div>
          <div>
            <span className="text-ink-muted block mb-0.5 font-medium">Recruiting Partner</span>
            <span className="font-semibold text-ink">{report.companyName}</span>
          </div>
          <div>
            <span className="text-ink-muted block mb-0.5 font-medium">Department &amp; Batch</span>
            <span className="font-semibold text-ink">
              {report.department} ({report.batch})
            </span>
          </div>
          <div>
            <span className="text-ink-muted block mb-0.5 font-medium">Evaluation Timestamp</span>
            <span className="font-semibold text-ink font-mono text-[11px] tabular-nums">
              {report.evaluatedAt}
            </span>
          </div>
        </div>

        {/* Deterministic Criteria Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink m-0">
              Evaluation Criteria &amp; Rules Breakdown
            </h4>
            <span className="text-[11px] text-ink-muted tabular-nums">
              {report.criteria.filter((c) => c.isSatisfied).length} / {report.criteria.length} passed
            </span>
          </div>

          <div className="space-y-2.5">
            {report.criteria.map((criterion, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs transition-colors duration-150 ${
                  criterion.isSatisfied
                    ? 'bg-surface border-line'
                    : criterion.isMissingData
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-red-50/50 border-red-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {criterion.isSatisfied ? (
                      <CheckCircle2 size={16} className="text-success shrink-0" />
                    ) : criterion.isMissingData ? (
                      <HelpCircle size={16} className="text-warning shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-danger shrink-0" />
                    )}
                    <span className="font-semibold text-ink">{criterion.ruleName}</span>
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
                      : 'Unmatched'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-line text-[11px]">
                  <div>
                    <span className="text-ink-muted block">Required:</span>
                    <span className="font-medium text-ink">{criterion.requirement}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block">Candidate Record:</span>
                    <span
                      className={`font-mono font-semibold tabular-nums ${
                        criterion.isSatisfied
                          ? 'text-success'
                          : criterion.isMissingData
                          ? 'text-warning'
                          : 'text-danger'
                      }`}
                    >
                      {criterion.studentValue}
                    </span>
                  </div>
                </div>

                {criterion.notes && (
                  <p className="text-[11px] text-ink-muted mt-1.5 italic bg-canvas p-1.5 rounded m-0">
                    {criterion.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Policy Governance & Cryptographic Provenance */}
        <div className="p-3.5 bg-canvas border border-line rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <ShieldCheck size={14} className="text-brand" />
            <span>Policy Engine Governance</span>
          </div>
          <p className="text-ink-muted text-[11px] leading-relaxed m-0">
            Evaluated under <strong>{report.policyVersion}</strong>. Results are calculated directly against registrar academic records.
          </p>
        </div>

        {/* TPO Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-line">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspection
          </Button>
          {report.overridePermitted && !isEligible && (
            <Button
              variant="primary"
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
