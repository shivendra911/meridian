import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface AiActionCardProps {
  title: string;
  domain: 'ACADEMIC' | 'IAM' | 'PLACEMENT' | 'STATUTORY';
  severity?: 'critical' | 'warning' | 'info' | 'recommendation';
  explanation: string;
  consequence: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onDismiss?: () => void;
  auditHash?: string;
  className?: string;
}

export const AiActionCard: React.FC<AiActionCardProps> = ({
  title,
  domain,
  severity = 'recommendation',
  explanation,
  consequence,
  primaryActionLabel,
  onPrimaryAction,
  onDismiss,
  auditHash,
  className = '',
}) => {
  const severityStyles = {
    critical: {
      border: 'border-l-4 border-l-red-600 border-red-200 bg-red-50/40',
      badge: 'destructive' as const,
      icon: <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />,
    },
    warning: {
      border: 'border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/40',
      badge: 'warning' as const,
      icon: <Clock size={15} className="text-amber-600 shrink-0 mt-0.5" />,
    },
    info: {
      border: 'border-l-4 border-l-blue-600 border-blue-200 bg-blue-50/40',
      badge: 'info' as const,
      icon: <Layers size={15} className="text-blue-600 shrink-0 mt-0.5" />,
    },
    recommendation: {
      border: 'border-l-4 border-l-[#8C1515] border-slate-200 bg-white shadow-xs',
      badge: 'ai' as const,
      icon: <Sparkles size={15} className="text-[#8C1515] shrink-0 mt-0.5" />,
    },
  }[severity];

  return (
    <div className={`p-4 rounded-lg border ${severityStyles.border} text-xs relative ${className}`}>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}

      <div className="flex items-start gap-2.5">
        {severityStyles.icon}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-900 text-xs">{title}</span>
            <Badge variant={severityStyles.badge} size="xs">
              {domain}
            </Badge>
          </div>

          <p className="text-slate-700 text-xs leading-relaxed mt-1">{explanation}</p>

          <div className="mt-2 p-2 bg-slate-50 border border-slate-200/80 rounded text-[11px] text-slate-600">
            <strong>Operational Consequence:</strong> {consequence}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="primary"
              size="xs"
              onClick={onPrimaryAction}
              rightIcon={<ArrowRight size={11} />}
            >
              {primaryActionLabel}
            </Button>

            {auditHash && (
              <span className="text-[10px] text-slate-400 font-mono">
                Verified: {auditHash}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

