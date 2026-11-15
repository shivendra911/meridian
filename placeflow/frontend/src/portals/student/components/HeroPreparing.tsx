import React from 'react';
import { StateBlock } from '../../../ui/StateBlock';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { StudentProfile } from '../api';

export interface HeroPreparingProps {
  profile: StudentProfile | null;
  onCompleteProfile: () => void;
}

export const HeroPreparing: React.FC<HeroPreparingProps> = ({ profile, onCompleteProfile }) => {
  const hasSkills = profile?.skills && profile.skills.length > 0;
  // Endowed progress: verified university data starts the student at 72%
  const completeness = hasSkills ? 100 : 72;

  return (
    <StateBlock variant="paper" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-brand flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-brand" /> DOSSIER PREPARATION
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-1 mb-0 font-display">
            {completeness === 100
              ? 'Your verified profile is recruitment-ready'
              : 'Complete your profile to unlock Super Dream drives'}
          </h2>
          <p className="text-xs text-ink-muted mt-1 m-0">
            {completeness === 100
              ? 'Institutional records & verified skill assessments are synced.'
              : '72% pre-filled from official registrar records. Add your technical skills to proceed.'}
          </p>
        </div>

        <div className="shrink-0">
          <Button
            variant="primary"
            pill
            size="md"
            onClick={onCompleteProfile}
            rightIcon={<ArrowRight size={15} />}
          >
            {completeness === 100 ? 'Review Profile' : 'Complete Next Step'}
          </Button>
        </div>
      </div>

      {/* Endowed Progress Meter */}
      <div className="pt-2 border-t border-line/60">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-ink flex items-center gap-1">
            <Sparkles size={13} className="text-now" />
            Endowed Profile Readiness
          </span>
          <span className="font-mono font-bold text-brand">{completeness}%</span>
        </div>
        <div className="w-full bg-line rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <p className="text-[11px] text-ink-muted mt-1.5 m-0">
          {completeness === 100
            ? '✓ CGPA, backlogs, department, and technical skills fully verified.'
            : 'Next milestone: Add programming languages & portfolio link.'}
        </p>
      </div>
    </StateBlock>
  );
};
