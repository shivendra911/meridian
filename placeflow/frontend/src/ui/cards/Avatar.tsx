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
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100',
  'bg-lime-50 text-lime-700 border-lime-100',
  'bg-orange-50 text-orange-700 border-orange-100',
];

function getPalette(name?: string | null): string {
  if (!name) return PALETTES[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
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

