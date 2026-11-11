import React from 'react';

export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-slate-200/80 ${className}`} />
);

export const DriveCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg border border-line bg-surface p-4 ${className}`}>
    <div className="flex items-start gap-3">
      <Shimmer className="h-10 w-10 rounded-lg shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-3/5" />
          <Shimmer className="h-5 w-20 rounded-md" />
        </div>
        <Shimmer className="h-3.5 w-2/5" />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-3">
      <Shimmer className="h-3.5 w-20" />
      <Shimmer className="h-3.5 w-20" />
      <Shimmer className="h-3.5 w-28" />
    </div>
    <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
      <Shimmer className="h-6 w-32 rounded-full" />
      <Shimmer className="h-8 w-20 rounded-md" />
    </div>
  </div>
);

export const ApplicationCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg border border-line bg-surface p-4 ${className}`}>
    <div className="flex items-start justify-between">
      <div className="space-y-1.5 flex-1">
        <Shimmer className="h-4 w-1/2" />
        <Shimmer className="h-3 w-1/3" />
      </div>
      <Shimmer className="h-5 w-20 rounded-md" />
    </div>
    <div className="mt-4 flex items-center justify-between px-2">
      <Shimmer className="h-3 w-3 rounded-full" />
      <Shimmer className="h-0.5 flex-1 mx-2" />
      <Shimmer className="h-3 w-3 rounded-full" />
      <Shimmer className="h-0.5 flex-1 mx-2" />
      <Shimmer className="h-3 w-3 rounded-full" />
    </div>
    <div className="mt-4 pt-2 border-t border-line">
      <Shimmer className="h-3 w-3/4" />
    </div>
  </div>
);

export const InterviewCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg border border-line bg-surface p-4 ${className}`}>
    <div className="flex items-start justify-between">
      <div className="space-y-1.5 flex-1">
        <Shimmer className="h-4 w-2/3" />
        <Shimmer className="h-3 w-1/2" />
      </div>
      <Shimmer className="h-5 w-16 rounded-md" />
    </div>
    <div className="mt-3.5 space-y-2">
      <Shimmer className="h-3.5 w-48" />
      <Shimmer className="h-3.5 w-40" />
    </div>
    <div className="mt-4 pt-3 border-t border-line flex justify-end">
      <Shimmer className="h-8 w-28 rounded-md" />
    </div>
  </div>
);

export const OfferCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg border border-line bg-surface p-4 ${className}`}>
    <div className="flex items-start justify-between">
      <div className="space-y-1.5 flex-1">
        <Shimmer className="h-4 w-1/2" />
        <Shimmer className="h-3 w-1/3" />
      </div>
      <Shimmer className="h-6 w-24 rounded-md" />
    </div>
    <div className="mt-3 space-y-2">
      <Shimmer className="h-3.5 w-44" />
    </div>
    <div className="mt-4 pt-3 border-t border-line flex items-center justify-end gap-2">
      <Shimmer className="h-8 w-20 rounded-md" />
      <Shimmer className="h-8 w-20 rounded-md" />
    </div>
  </div>
);

export const CompanyCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg border border-line bg-surface p-4 ${className}`}>
    <div className="flex items-center gap-3">
      <Shimmer className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Shimmer className="h-4 w-1/2" />
        <Shimmer className="h-3 w-1/3" />
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
      <Shimmer className="h-3.5 w-24" />
      <Shimmer className="h-3.5 w-28" />
    </div>
  </div>
);

export const TaskCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg border border-line bg-surface p-3.5 flex items-center justify-between gap-3 ${className}`}>
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Shimmer className="h-8 w-8 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/3" />
      </div>
    </div>
    <Shimmer className="h-7 w-20 rounded-md shrink-0" />
  </div>
);

export const ProfileCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-80 rounded-lg border border-line bg-surface p-4 space-y-3 ${className}`}>
    <div className="flex items-start gap-3">
      <Shimmer className="h-14 w-14 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Shimmer className="h-4 w-4/5" />
        <Shimmer className="h-3 w-3/5" />
        <div className="flex gap-1.5 pt-1">
          <Shimmer className="h-4 w-16 rounded" />
          <Shimmer className="h-4 w-24 rounded" />
        </div>
      </div>
    </div>
    <div className="border-t border-line pt-3 space-y-2">
      <div className="flex justify-between">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-3 w-24" />
      </div>
    </div>
    <div className="border-t border-line pt-3 flex justify-end">
      <Shimmer className="h-7 w-24 rounded" />
    </div>
  </div>
);

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg border border-line bg-surface p-4 space-y-2 ${className}`}>
    <Shimmer className="h-3.5 w-24" />
    <Shimmer className="h-7 w-20" />
    <Shimmer className="h-3 w-16" />
  </div>
);

