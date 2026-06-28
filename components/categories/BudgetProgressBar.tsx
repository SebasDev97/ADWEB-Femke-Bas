'use client';

interface BudgetProgressBarProps {
  usageRatio: number;
  isWarning: boolean;
  isAtLimit: boolean;
  isExceeded: boolean;
}

export default function BudgetProgressBar({
  usageRatio,
  isWarning,
  isAtLimit,
  isExceeded,
}: BudgetProgressBarProps) {
  const barWidthPercent = Math.min(usageRatio * 100, 100);

  const barColourClass = isExceeded
    ? 'bg-red-500'
    : isAtLimit
      ? 'bg-orange-500'
      : isWarning
        ? 'bg-amber-500'
        : 'bg-indigo-500';

  return (
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${barColourClass}`}
        style={{ width: `${barWidthPercent}%` }}
      />
    </div>
  );
}
