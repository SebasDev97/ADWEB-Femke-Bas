import { computeCategoryBudgets } from '@/hooks/useCategoryBudget';
import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';
import { Timestamp } from 'firebase/firestore';

const stubTimestamp = new Timestamp(0, 0);

const baseCategory: Category = {
  id: 'cat-1',
  bookId: 'book-1',
  name: 'Groceries',
  maxBudget: 10000,
  endDate: null,
  createdAt: stubTimestamp,
  createdBy: 'u1',
};

const makeExpense = (categoryId: string | null, amountCents: number): Transaction => ({
  id: `tx-${amountCents}`,
  bookId: 'book-1',
  categoryId,
  type: 'expense',
  amountCents,
  description: 'Test expense',
  date: stubTimestamp,
  createdAt: stubTimestamp,
  createdBy: 'u1',
});

const makeIncome = (categoryId: string | null, amountCents: number): Transaction => ({
  ...makeExpense(categoryId, amountCents),
  type: 'income',
});

describe('computeCategoryBudgets', () => {
  it('sums only expenses linked to the category', () => {
    const transactions = [
      makeExpense('cat-1', 3000),
      makeExpense('cat-1', 2000),
      makeExpense('cat-other', 5000),
      makeIncome('cat-1', 8000),
    ];

    const [summary] = computeCategoryBudgets([baseCategory], transactions);

    expect(summary.spentCents).toBe(5000);
  });

  it('computes remainingCents as maxBudget minus spentCents', () => {
    const transactions = [makeExpense('cat-1', 3000)];

    const [summary] = computeCategoryBudgets([baseCategory], transactions);

    expect(summary.remainingCents).toBe(7000);
  });

  it('sets isWarning true when usage is at or above 80% but not exceeded', () => {
    const transactions = [makeExpense('cat-1', 8000)];

    const [summary] = computeCategoryBudgets([baseCategory], transactions);

    expect(summary.isWarning).toBe(true);
    expect(summary.isExceeded).toBe(false);
  });

  it('sets isExceeded true and isWarning false when spending exceeds budget', () => {
    const transactions = [makeExpense('cat-1', 11000)];

    const [summary] = computeCategoryBudgets([baseCategory], transactions);

    expect(summary.isExceeded).toBe(true);
    expect(summary.isWarning).toBe(false);
  });

  it('reports zero spent when there are no transactions', () => {
    const [summary] = computeCategoryBudgets([baseCategory], []);

    expect(summary.spentCents).toBe(0);
    expect(summary.usageRatio).toBe(0);
    expect(summary.isWarning).toBe(false);
    expect(summary.isExceeded).toBe(false);
  });

  it('handles multiple categories independently', () => {
    const secondCategory: Category = { ...baseCategory, id: 'cat-2', name: 'Transport', maxBudget: 4000 };
    const transactions = [
      makeExpense('cat-1', 2000),
      makeExpense('cat-2', 3500),
    ];

    const summaries = computeCategoryBudgets([baseCategory, secondCategory], transactions);

    expect(summaries[0].spentCents).toBe(2000);
    expect(summaries[1].spentCents).toBe(3500);
    expect(summaries[1].isWarning).toBe(true);
  });
});
