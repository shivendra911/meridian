import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from './Avatar';
import { ProfileCard, ProfileCardData } from './ProfileCard';
import { formatRoleLabel } from '../format';

export interface PersonChipProps {
  name: string;
  avatar_url?: string | null;
  role?: string | null;
  person_id?: string;
  profileData?: ProfileCardData;
  onClick?: () => void;
  className?: string;
}

export const PersonChip: React.FC<PersonChipProps> = ({
  name,
  avatar_url,
  role,
  person_id,
  profileData,
  onClick,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (onClick) {
        e.preventDefault();
        onClick();
      } else {
        setIsOpen((prev) => !prev);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cardData: ProfileCardData = profileData || {
    person_id,
    name,
    avatar_url,
    roles: role ? [role] : ['Member'],
    is_verified: true,
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        onKeyDown={handleKeyDown}
        className="macos-press-sm inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-0.5 pl-0.5 pr-2.5 text-xs text-ink hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 transition-colors cursor-pointer"
      >
        <Avatar src={avatar_url} name={name} size={24} />
        <span className="font-medium truncate max-w-[140px]">{name}</span>
        {person_id && (
          <span className="text-[11px] text-ink-muted font-normal truncate">· {person_id}</span>
        )}
        {role && !person_id && (
          <span className="text-xs text-ink-muted">· {formatRoleLabel(role)}</span>
        )}
      </button>

      {/* Profile popover */}
      {isOpen && (
        <div
          role="dialog"
          className="absolute left-0 top-full z-50 mt-1.5 macos-menu-pop macos-frosted-popover rounded-xl shadow-macos-menu"
        >
          <ProfileCard
            data={cardData}
            onViewProfile={onClick}
            className="shadow-xl ring-1 ring-black/5"
          />
        </div>
      )}
    </div>
  );
};

