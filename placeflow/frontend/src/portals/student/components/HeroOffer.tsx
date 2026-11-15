import React, { useState } from 'react';
import { StateBlock } from '../../../ui/StateBlock';
import { CompanyMark } from '../../../ui/cards/CompanyMark';
import { Button } from '../../../components/ui/Button';
import { Award, Check, Clock, X } from 'lucide-react';
import { StudentOffer } from '../api';

export interface HeroOfferProps {
  offer: StudentOffer & { company_name?: string; response_deadline?: string };
  onAccept?: (offer: StudentOffer) => void;
  onDecline?: (offer: StudentOffer) => void;
}

export const HeroOffer: React.FC<HeroOfferProps> = ({ offer, onAccept, onDecline }) => {
  const [isConfirmingDecline, setIsConfirmingDecline] = useState(false);
  const companyName = offer.company_name || offer.company_id || 'Corporate Partner';

  return (
    <StateBlock variant="teal" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-teal-200 flex items-center gap-1.5">
            <Award size={14} /> OFFICIAL PLACEMENT OFFER
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 mb-0 font-display">
            {offer.role || 'Placement Offer'}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <CompanyMark name={companyName} size="sm" />
            <span className="text-sm font-semibold text-white/95">{companyName}</span>
            <span className="text-white/60">·</span>
            <span className="text-sm font-bold text-teal-100">₹{offer.package_lpa} LPA</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isConfirmingDecline ? (
            <>
              <Button
                variant="now"
                pill
                size="md"
                onClick={() => onAccept?.(offer)}
                leftIcon={<Check size={16} />}
              >
                Accept Offer
              </Button>
              <Button
                variant="ghost"
                pill
                size="md"
                onClick={() => setIsConfirmingDecline(true)}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Decline
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-full">
              <span className="text-xs text-white px-2">Are you sure?</span>
              <Button
                variant="destructive"
                pill
                size="xs"
                onClick={() => {
                  onDecline?.(offer);
                  setIsConfirmingDecline(false);
                }}
              >
                Confirm Decline
              </Button>
              <Button
                variant="ghost"
                pill
                size="xs"
                onClick={() => setIsConfirmingDecline(false)}
                className="text-white/80"
              >
                <X size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-white/15 text-xs text-white/80">
        <Clock size={14} className="text-teal-200 shrink-0" />
        <span>
          {offer.response_deadline
            ? `Please submit your response before ${offer.response_deadline}`
            : 'Decision pending student signature confirmation'}
        </span>
      </div>
    </StateBlock>
  );
};
