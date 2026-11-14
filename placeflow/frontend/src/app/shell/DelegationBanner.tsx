import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';

export const DelegationBanner: React.FC = () => {
  const { me } = useAuth();

  const isDelegation = Boolean(me?.delegation);
  const isBreakGlass = Boolean(me?.break_glass);

  if (!isDelegation && !isBreakGlass) return null;

  const title = isBreakGlass
    ? `Emergency Break-Glass Mode Active (Audited)`
    : `Acting as ${me?.delegation?.delegator_name || 'Delegator'}`;

  const untilText = me?.delegation?.valid_to
    ? ` until ${new Date(me.delegation.valid_to).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <div className="flex w-full items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-900 shadow-xs border-b border-amber-600">
      <div className="flex items-center gap-2 truncate">
        <AlertTriangle size={15} className="shrink-0 text-slate-900" />
        <span className="truncate">
          {title}
          {untilText}
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          // Re-trigger reload to default identity context
          window.location.reload();
        }}
        className="inline-flex shrink-0 items-center gap-1 rounded bg-black/15 px-2 py-0.5 text-xs font-bold text-slate-900 hover:bg-black/25 focus:outline-none transition-colors"
      >
        <span>End</span>
        <X size={12} />
      </button>
    </div>
  );
};
