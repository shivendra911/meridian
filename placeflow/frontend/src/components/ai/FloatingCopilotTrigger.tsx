import React, { useEffect } from 'react';
import { Sparkles, GraduationCap, Briefcase, Users, Award, Landmark, Shield } from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';

export interface FloatingCopilotTriggerProps {
  onClick: () => void;
  portal?: string;
  className?: string;
}

export const FloatingCopilotTrigger: React.FC<FloatingCopilotTriggerProps> = ({
  onClick,
  portal,
  className = '',
}) => {
  const { me } = useAuth();

  // Determine active portal / role persona
  const activePortal =
    portal || me?.default_portal || (me?.portals && me.portals[0]) || 'student';

  const getRoleMetadata = (p: string) => {
    switch (p) {
      case 'tpo':
        return {
          icon: Briefcase,
          label: 'Placement Copilot',
          badge: 'TPO Ops',
          gradient: 'from-amber-600 via-brand to-brand',
          border: 'border-amber-400/40',
          glow: 'shadow-[0_4px_20px_rgba(245,165,36,0.25)]',
        };
      case 'faculty':
        return {
          icon: Users,
          label: 'Faculty Copilot',
          badge: 'Advising',
          gradient: 'from-indigo-600 via-brand to-brand',
          border: 'border-indigo-400/40',
          glow: 'shadow-[0_4px_20px_rgba(99,102,241,0.25)]',
        };
      case 'hod':
        return {
          icon: Award,
          label: 'Executive Copilot',
          badge: 'HOD',
          gradient: 'from-emerald-600 via-brand to-brand',
          border: 'border-emerald-400/40',
          glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.25)]',
        };
      case 'management':
        return {
          icon: Landmark,
          label: 'Strategy Copilot',
          badge: 'NIRF & Trust',
          gradient: 'from-purple-600 via-brand to-brand',
          border: 'border-purple-400/40',
          glow: 'shadow-[0_4px_20px_rgba(168,85,247,0.25)]',
        };
      case 'admin':
        return {
          icon: Shield,
          label: 'Campus AI Auditor',
          badge: 'Superuser',
          gradient: 'from-red-600 via-brand to-brand',
          border: 'border-red-400/40',
          glow: 'shadow-[0_4px_20px_rgba(239,68,68,0.25)]',
        };
      case 'student':
      default:
        return {
          icon: GraduationCap,
          label: 'Career Copilot',
          badge: 'AI Guide',
          gradient: 'from-amber-500 via-brand to-brand',
          border: 'border-amber-400/50',
          glow: 'shadow-[0_4px_20px_rgba(245,165,36,0.3)]',
        };
    }
  };

  const meta = getRoleMetadata(activePortal);
  const Icon = meta.icon;

  // Global Ctrl+J / Cmd+J or Ctrl+/ keyboard shortcut to toggle Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'j' || e.key === '/')) {
        e.preventDefault();
        onClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClick]);

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ease-out select-none ${
        activePortal === 'student'
          ? 'bottom-20 right-4 sm:bottom-6 sm:right-6'
          : 'bottom-6 right-6'
      } ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`group relative flex items-center gap-2.5 rounded-full bg-surface border ${meta.border} p-1.5 pr-4 text-xs font-semibold text-ink ${meta.glow} hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md`}
        aria-label={`Open ${meta.label} (Ctrl+J)`}
      >
        {/* Glowing AI Icon Badge */}
        <div
          className={`relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr ${meta.gradient} text-white shadow-xs overflow-hidden`}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icon size={16} className="relative z-10 transition-transform group-hover:scale-110" />
          <Sparkles
            size={10}
            className="absolute top-1 right-1 text-amber-300 animate-pulse"
          />
        </div>

        {/* Text Details */}
        <div className="flex flex-col text-left">
          <span className="font-bold tracking-tight text-ink flex items-center gap-1.5 leading-tight">
            <span>{meta.label}</span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-800 border border-amber-300/40">
              {meta.badge}
            </span>
          </span>
          <span className="text-[10px] text-ink-muted leading-tight font-mono">
            Press <kbd className="font-semibold text-ink">Ctrl + J</kbd>
          </span>
        </div>
      </button>
    </div>
  );
};
