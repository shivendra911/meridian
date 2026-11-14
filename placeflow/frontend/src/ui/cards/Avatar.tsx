import React from 'react';
import { initials } from '../format';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 20 | 24 | 32 | 40 | 56 | 64 | 96;
  presence?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
  onClick?: () => void;
}

const PALETTES = [
  'bg-blue-100 text-blue-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-purple-100 text-purple-800',
  'bg-rose-100 text-rose-800',
  'bg-indigo-100 text-indigo-800',
  'bg-teal-100 text-teal-800',
  'bg-slate-100 text-slate-800',
];

function getPalette(name?: string | null): string {
  if (!name) return PALETTES[7];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PALETTES.length;
  return PALETTES[idx];
}

const SIZE_CLASSES: Record<number, { container: string; text: string; ring: string }> = {
  20: { container: 'w-5 h-5', text: 'text-xs font-semibold', ring: 'w-1.5 h-1.5 -bottom-0.5 -right-0.5' },
  24: { container: 'w-6 h-6', text: 'text-xs font-semibold', ring: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  32: { container: 'w-8 h-8', text: 'text-xs font-semibold', ring: 'w-2.5 h-2.5 bottom-0 right-0' },
  40: { container: 'w-10 h-10', text: 'text-sm font-semibold', ring: 'w-3 h-3 bottom-0 right-0' },
  56: { container: 'w-14 h-14', text: 'text-base font-semibold', ring: 'w-3.5 h-3.5 bottom-0.5 right-0.5' },
  64: { container: 'w-16 h-16', text: 'text-lg font-semibold', ring: 'w-4 h-4 bottom-0.5 right-0.5' },
  96: { container: 'w-24 h-24', text: 'text-2xl font-semibold', ring: 'w-5 h-5 bottom-1 right-1' },
};

const PRESENCE_COLORS: Record<string, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 32,
  presence,
  className = '',
  onClick,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES[32];
  const palette = getPalette(name);
  const userInitials = initials(name);

  const hasValidImage = src && !imageError;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 select-none items-center justify-center rounded-full ${
        sizeConfig.container
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {hasValidImage ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          onError={() => setImageError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full ${palette} ${sizeConfig.text}`}
          title={name || undefined}
        >
          {userInitials}
        </div>
      )}

      {presence && (
        <span
          className={`absolute rounded-full border-2 border-surface ${
            PRESENCE_COLORS[presence] || 'bg-slate-400'
          } ${sizeConfig.ring}`}
          aria-label={`Status: ${presence}`}
        />
      )}
    </div>
  );
};

