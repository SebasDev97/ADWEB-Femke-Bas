'use client';

import Link from 'next/link';
import type { CategoryBudgetSummary } from '@/hooks/useCategoryBudget';
import BudgetProgressBar from './BudgetProgressBar';
import BudgetSummaryBadge from './BudgetSummaryBadge';

interface CategoryCardProps {
  summary: CategoryBudgetSummary;
  bookId: string;
  onDelete: (categoryId: string) => void;
  isDragOver?: boolean;
}

export default function CategoryCard({
  summary,
  bookId,
  onDelete,
  isDragOver = false,
}: CategoryCardProps) {
  const endDateLabel = summary.endDate
    ? new Date(summary.endDate.toMillis()).toLocaleDateString('nl-NL')
    : null;

  const cardBorderClass = isDragOver
    ? 'border-indigo-400 bg-indigo-50 shadow-md'
    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm';

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${cardBorderClass}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{summary.name}</p>
          {endDateLabel && (
            <span className="inline-block mt-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Until {endDateLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/householdbooks/${bookId}/categories/${summary.id}/edit`}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete(summary.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <BudgetSummaryBadge
        spentCents={summary.spentCents}
        maxBudget={summary.maxBudget}
        isWarning={summary.isWarning}
        isExceeded={summary.isExceeded}
      />
      <div className="mt-2">
        <BudgetProgressBar
          usageRatio={summary.usageRatio}
          isWarning={summary.isWarning}
          isExceeded={summary.isExceeded}
        />
      </div>

      {summary.isExceeded && (
        <p className="mt-2 text-xs font-medium text-red-600">Over budget</p>
      )}
      {summary.isWarning && (
        <p className="mt-2 text-xs font-medium text-amber-600">Almost at budget limit</p>
      )}
    </div>
  );
}
