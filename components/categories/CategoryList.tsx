'use client';

import type { CategoryBudgetSummary } from '@/hooks/useCategoryBudget';
import CategoryCard from './CategoryCard';

interface CategoryListProps {
  summaries: CategoryBudgetSummary[];
  bookId: string;
  onDelete: (categoryId: string) => void;
  dragOverCategoryId?: string | null;
}

export default function CategoryList({
  summaries,
  bookId,
  onDelete,
  dragOverCategoryId,
}: CategoryListProps) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No categories yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {summaries.map((summary) => (
        <li key={summary.id}>
          <CategoryCard
            summary={summary}
            bookId={bookId}
            onDelete={onDelete}
            isDragOver={dragOverCategoryId === summary.id}
          />
        </li>
      ))}
    </ul>
  );
}
