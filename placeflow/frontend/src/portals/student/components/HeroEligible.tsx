import React from 'react';
import { StateBlock } from '../../../ui/StateBlock';
import { CompanyMark } from '../../../ui/cards/CompanyMark';
import { Button } from '../../../components/ui/Button';
import { Compass, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { StudentOpportunity } from '../api';
import { formatDate } from '../../../ui/format';

export interface HeroEligibleProps {
  topOpportunity: StudentOpportunity;
  eligibleCount: number;
  onExplore: () => void;
  onApply: (jobId: string) => void;
}

export const HeroEligible: React.FC<HeroEligibleProps> = ({
  topOpportunity,
  eligibleCount,
  onExplore,
  onApply,
}) => {
  return (
    <StateBlock variant="paper" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-brand flex items-center gap-1.5">
            <Sparkles size={14} className="text-now" /> {eligibleCount} RECRUITMENT DRIVES OPEN
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-1 mb-0 font-display">
            You qualify for {topOpportunity.company_name} — {topOpportunity.title}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <CompanyMark name={topOpportunity.company_name} size="sm" />
            <span className="text-xs font-semibold text-ink">{topOpportunity.company_name}</span>
            <span className="text-ink-muted">·</span>
            <span className="text-xs font-bold text-brand">₹{topOpportunity.package_lpa} LPA</span>
            <span className="text-ink-muted">·</span>
            <span className="text-[11px] font-medium text-ink-muted">{topOpportunity.tier}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="now"
            pill
            size="md"
            onClick={() => onApply(topOpportunity.job_id)}
          >
            Apply Now
          </Button>
          <Button
            variant="outline"
            pill
            size="md"
            onClick={onExplore}
            leftIcon={<Compass size={14} />}
          >
            All Drives ({eligibleCount})
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-line/60 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5 text-success font-medium">
          <CheckCircle2 size={13} />
          <span>All academic eligibility criteria met</span>
        </div>
        {topOpportunity.deadline && (
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-now shrink-0" />
            <span>Closes {formatDate(topOpportunity.deadline)}</span>
          </div>
        )}
      </div>
    </StateBlock>
  );
};
