import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatCard as UiStatCard } from '../ui/StatCard';

interface StatCardProps {
  label: string;
  value: string | number;
  context?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'cardinal' | 'forest' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  context,
  icon,
}) => {
  return (
    <UiStatCard
      label={label}
      value={value}
      hint={context}
      icon={icon}
    />
  );
};
