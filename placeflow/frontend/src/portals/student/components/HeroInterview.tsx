import React, { useState } from 'react';
import { StateBlock } from '../../../ui/StateBlock';
import { CompanyMark } from '../../../ui/cards/CompanyMark';
import { Button } from '../../../components/ui/Button';
import { Calendar, MapPin, CheckSquare, Square, Video, Sparkles } from 'lucide-react';
import { formatDateTime } from '../../../ui/format';
import { StudentInterview } from '../api';

export interface HeroInterviewProps {
  interview: StudentInterview;
  onJoin?: () => void;
  onOpenCopilot?: () => void;
}

export const HeroInterview: React.FC<HeroInterviewProps> = ({ interview, onJoin, onOpenCopilot }) => {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    resume: true,
    idCard: false,
    revision: false,
  });

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isVirtual = interview.mode?.toLowerCase() === 'virtual' || interview.venue_or_link?.startsWith('http');

  return (
    <StateBlock variant="navy" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-now">
            INTERVIEW {interview.scheduled_start ? 'UPCOMING' : 'SCHEDULED'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 mb-0 font-display">
            Round {interview.round}: {interview.role || 'Campus Interview'}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <CompanyMark name={interview.company_name || 'Recruiter'} size="sm" />
            <span className="text-sm font-semibold text-white/90">
              {interview.company_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {interview.venue_or_link?.startsWith('http') ? (
            <Button
              variant="now"
              pill
              size="md"
              onClick={onJoin || (() => window.open(interview.venue_or_link, '_blank'))}
              leftIcon={<Video size={16} />}
            >
              Join Virtual Room
            </Button>
          ) : (
            <Button
              variant="now"
              pill
              size="md"
              onClick={() => alert(`Venue location: ${interview.venue_or_link || 'Campus Placement Office'}`)}
              leftIcon={<MapPin size={16} />}
            >
              Directions
            </Button>
          )}
        </div>
      </div>

      {/* Meta Row: Time & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10 text-xs text-white/80">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-now shrink-0" />
          <span>{formatDateTime(interview.scheduled_start) || 'Slot confirming'}</span>
        </div>
        <div className="flex items-center gap-2">
          {isVirtual ? (
            <Video size={15} className="text-now shrink-0" />
          ) : (
            <MapPin size={15} className="text-now shrink-0" />
          )}
          <span className="truncate">{interview.venue_or_link || interview.mode || 'Main Campus Hall'}</span>
        </div>
      </div>

      {/* Pre-flight Checklist */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">
          Before you enter:
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/90">
          <button
            type="button"
            onClick={() => toggleChecklist('resume')}
            className="flex items-center gap-1.5 cursor-pointer hover:text-white"
          >
            {checklist.resume ? (
              <CheckSquare size={16} className="text-now" />
            ) : (
              <Square size={16} className="text-white/40" />
            )}
            <span className={checklist.resume ? 'line-through text-white/60' : ''}>
              Printed 2 resumes
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleChecklist('idCard')}
            className="flex items-center gap-1.5 cursor-pointer hover:text-white"
          >
            {checklist.idCard ? (
              <CheckSquare size={16} className="text-now" />
            ) : (
              <Square size={16} className="text-white/40" />
            )}
            <span className={checklist.idCard ? 'line-through text-white/60' : ''}>
              College ID badge
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleChecklist('revision')}
            className="flex items-center gap-1.5 cursor-pointer hover:text-white"
          >
            {checklist.revision ? (
              <CheckSquare size={16} className="text-now" />
            ) : (
              <Square size={16} className="text-white/40" />
            )}
            <span className={checklist.revision ? 'line-through text-white/60' : ''}>
              Revised core skills
            </span>
          </button>

          {onOpenCopilot && (
            <button
              type="button"
              onClick={onOpenCopilot}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors ml-auto cursor-pointer"
            >
              <Sparkles size={12} className="text-now animate-pulse" />
              <span>Revise with Copilot</span>
            </button>
          )}
        </div>
      </div>
    </StateBlock>
  );
};
