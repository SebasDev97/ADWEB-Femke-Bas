import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';

export interface CategoryBudgetSummary extends Category {
  spentCents: number;
  remainingCents: number;
  usageRatio: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export function computeCategoryBudgets(
  categories: Category[],
  transactions: Transaction[],
): CategoryBudgetSummary[] {
  return categories.map((category) => {
    const spentCents = transactions
      .filter(
        (transaction) =>
          transaction.categoryId === category.id && transaction.type === 'expense',
      )
      .reduce((total, transaction) => total + transaction.amountCents, 0);
    const remainingCents = category.maxBudget - spentCents;
    const usageRatio = category.maxBudget > 0 ? spentCents / category.maxBudget : 0;
    return {
      ...category,
      spentCents,
      remainingCents,
      usageRatio,
      isWarning: usageRatio >= 0.8 && usageRatio <= 1.0,
      isExceeded: usageRatio > 1.0,
    };
  });
}

export function useCategoryBudget(
  categories: Category[],
  transactions: Transaction[],
): CategoryBudgetSummary[] {
  return computeCategoryBudgets(categories, transactions);
}
