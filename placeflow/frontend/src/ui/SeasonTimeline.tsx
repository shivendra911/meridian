import React from 'react';
import { CompanyMark } from './cards/CompanyMark';
import { AlertCircle } from 'lucide-react';

export interface TimelineStage {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  type: 'reg' | 'test' | 'interview' | 'offer';
  hasClash?: boolean;
}

export interface SeasonDriveItem {
  id: string;
  companyName: string;
  role: string;
  isPublished?: boolean;
  hasClash?: boolean;
  clashReason?: string;
  stages: TimelineStage[];
}

export interface SeasonTimelineProps {
  drives: SeasonDriveItem[];
  months: string[]; // e.g. ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
  todayPositionPercent?: number; // e.g. 35%
  onDriveClick: (driveId: string) => void;
  className?: string;
}

export const SeasonTimeline: React.FC<SeasonTimelineProps> = ({
  drives,
  months = ['Nov', 'Dec', 'Jan', 'Feb'],
  todayPositionPercent = 42,
  onDriveClick,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-line bg-surface p-5 shadow-xs ${className}`}>
      {/* Month Columns Header */}
      <div className="relative border-b border-line pb-3 mb-4">
        <div className="grid grid-cols-4 pl-48 text-xs font-bold text-ink-muted uppercase tracking-wider text-center">
          {months.map((m) => (
            <div key={m} className="border-l border-line/40 first:border-l-0">
              {m}
            </div>
          ))}
        </div>

        {/* Today line marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-now z-20 pointer-events-none"
          style={{ left: `calc(12rem + (100% - 12rem) * ${todayPositionPercent / 100})` }}
        >
          <div className="absolute -top-1 -translate-x-1/2 rounded bg-now px-1.5 py-0.2 text-[10px] font-bold text-now-ink shadow-xs">
            TODAY
          </div>
        </div>
      </div>

      {/* Drives Rows */}
      <div className="relative divide-y divide-line/40 space-y-2">
        {/* Continuous today line running down rows */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-now/70 z-10 pointer-events-none"
          style={{ left: `calc(12rem + (100% - 12rem) * ${todayPositionPercent / 100})` }}
        />

        {drives.map((drive) => (
          <div
            key={drive.id}
            onClick={() => onDriveClick(drive.id)}
            className="flex items-center pt-2 pb-2 group hover:bg-surface-muted/60 rounded-lg px-2 cursor-pointer transition-colors"
          >
            {/* Left Company Identity */}
            <div className="w-48 pr-4 shrink-0 flex items-center gap-2.5">
              <CompanyMark name={drive.companyName} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate m-0 group-hover:text-brand">
                  {drive.companyName}
                </p>
                <p className="text-[11px] text-ink-muted truncate m-0">{drive.role}</p>
              </div>
              {drive.hasClash && (
                <span title={drive.clashReason || 'Schedule Clash'} className="shrink-0 ml-auto">
                  <AlertCircle size={14} className="text-danger" />
                </span>
              )}
            </div>

            {/* Right Stages Strip */}
            <div className="flex-1 relative h-7 flex items-center bg-canvas/60 rounded-md border border-line/50 overflow-hidden px-1">
              {drive.stages.map((stg) => (
                <div
                  key={stg.id}
                  className={`h-5 rounded px-2 text-[10px] font-semibold flex items-center justify-center mr-1 truncate transition-transform hover:scale-102 ${
                    stg.hasClash
                      ? 'bg-danger text-white'
                      : stg.type === 'interview'
                      ? 'bg-brand text-white'
                      : stg.type === 'offer'
                      ? 'bg-block-teal text-white'
                      : 'bg-surface border border-line text-ink'
                  } ${!drive.isPublished ? 'border-dashed' : ''}`}
                >
                  {stg.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
