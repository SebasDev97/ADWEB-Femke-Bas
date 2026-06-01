'use client';

import { centsToCurrencyString } from '@/utils/money';

interface BudgetSummaryBadgeProps {
  spentCents: number;
  maxBudget: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export default function BudgetSummaryBadge({
  spentCents,
  maxBudget,
  isWarning,
  isExceeded,
}: BudgetSummaryBadgeProps) {
  const textColourClass = isExceeded
    ? 'text-red-600'
    : isWarning
      ? 'text-amber-600'
      : 'text-slate-600';

  return (
    <p className={`text-sm font-medium ${textColourClass}`}>
      {centsToCurrencyString(spentCents)} / {centsToCurrencyString(maxBudget)}
    </p>
  );
}
