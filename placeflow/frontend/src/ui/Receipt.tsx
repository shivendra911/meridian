import React from 'react';
import { CheckCircle2, XCircle, Clock, Info } from 'lucide-react';

export type ReceiptLineStatus = 'pass' | 'fail' | 'pending' | 'info';

export interface ReceiptLine {
  id?: string;
  label: string;
  value: string;
  status?: ReceiptLineStatus;
  detail?: string;
}

export interface ReceiptProps {
  title: string;
  lines: ReceiptLine[];
  timestamp?: string;
  animate?: boolean;
  className?: string;
}

export const Receipt: React.FC<ReceiptProps> = ({
  title,
  lines,
  timestamp,
  animate = false,
  className = '',
}) => {
  const getStatusIcon = (status?: ReceiptLineStatus) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-label="Passed" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-danger shrink-0" aria-label="Failed" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning shrink-0" aria-label="Pending" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-ink-muted shrink-0" aria-label="Information" />;
    }
  };

  return (
    <div
      className={`rounded-xl border border-line bg-surface p-5 text-ink shadow-xs ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
        <h3 className="text-sm font-semibold text-ink m-0">{title}</h3>
        {timestamp && <span className="text-xs text-ink-muted font-mono">{timestamp}</span>}
      </div>

      <div className="divide-y divide-line/60">
        {lines.map((line, idx) => (
          <div
            key={line.id || idx}
            className={`py-2.5 flex items-start justify-between gap-4 transition-all duration-200 ${
              animate ? 'animate-in fade-in slide-in-from-top-1' : ''
            }`}
            style={animate ? { animationDelay: `${idx * 80}ms` } : undefined}
          >
            <div className="flex items-start gap-2 min-w-0">
              {getStatusIcon(line.status)}
              <div>
                <p className="text-xs font-medium text-ink m-0">{line.label}</p>
                {line.detail && (
                  <p className="text-[11px] text-ink-muted mt-0.5 m-0">{line.detail}</p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-medium text-ink">{line.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
