'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategoryBudget } from '@/hooks/useCategoryBudget';
import { deleteTransaction, assignCategory } from '@/services/transactionService';
import TransactionItem from '@/components/transactions/TransactionItem';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionStatistics from '@/components/transactions/TransactionStatistics';
import MonthSelector from '@/components/transactions/MonthSelector';
import CategoryCard from '@/components/categories/CategoryCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CategoryCharts from '@/components/categories/CategoryCharts';
import ErrorBanner from '@/components/ui/ErrorBanner';
import Navbar from '@/components/Navbar';
import type { Transaction } from '@/types/transaction';
import type { CategoryBudgetSummary } from '@/hooks/useCategoryBudget';

function DroppableCategoryCard({
  summary,
  bookId,
  onDelete,
  dragOverCategoryId,
  isCollapsed,
  transactionCount,
  onToggleCollapse,
}: {
  summary: CategoryBudgetSummary;
  bookId: string;
  onDelete: (categoryId: string) => void;
  dragOverCategoryId: string | null;
  isCollapsed: boolean;
  transactionCount: number;
  onToggleCollapse: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: summary.id });
  return (
    <div ref={setNodeRef}>
      <CategoryCard
        summary={summary}
        bookId={bookId}
        onDelete={onDelete}
        isDragOver={dragOverCategoryId === summary.id}
        isCollapsed={isCollapsed}
        transactionCount={transactionCount}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  );
}

function DroppableUncategorisedZone({
  isActive,
  children,
}: {
  isActive: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: 'uncategorised' });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed transition-all p-3 ${
        isActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'
      }`}
    >
      {children}
    </div>
  );
}

export default function TransactionsPage() {
  const { id: bookId } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const authedBookId = !loading && user ? bookId : null;
  const { categories, loading: categoriesLoading } = useCategories(authedBookId);
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions(authedBookId);

  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<string[]>([]);
  const [transactionIdPendingDeletion, setTransactionIdPendingDeletion] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [activeDragTransaction, setActiveDragTransaction] = useState<Transaction | null>(null);
  const [dragOverDroppableId, setDragOverDroppableId] = useState<string | null>(null);
  const [optimisticTransactions, setOptimisticTransactions] = useState<Transaction[] | null>(null);

  const displayedTransactions = optimisticTransactions ?? transactions;

  const filteredTransactions = useMemo(() => {
    return displayedTransactions.filter((transaction) => {
      const date = transaction.date.toDate();
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [displayedTransactions, selectedMonth, selectedYear]);

  const categoryBudgetSummaries = useCategoryBudget(categories, filteredTransactions);

  const dailyChartData = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return [];
    }

    const dailyTotals = new Map<string, { income: number; expenses: number }>();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Initialiseer alle dagen van de maand zodat de grafiek een continue as heeft
    for (let i = 1; i <= daysInMonth; i++) {
      dailyTotals.set(String(i), { income: 0, expenses: 0 });
    }

    filteredTransactions.forEach((transaction) => {
      const date = transaction.date.toDate();
      const day = String(date.getDate());

      const currentTotals = dailyTotals.get(day)!;
      if (transaction.type === 'income') {
        currentTotals.income += transaction.amountCents;
      } else {
        currentTotals.expenses += transaction.amountCents;
      }
    });

    const sortedDailyData = Array.from(dailyTotals.entries()).map(([day, totals]) => ({
      day: day,
      income: totals.income / 100,
      expenses: totals.expenses / 100,
    }));

    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;
    return sortedDailyData.map((data) => {
      cumulativeIncome += data.income;
      cumulativeExpenses += data.expenses;
      return { ...data, income: cumulativeIncome, expenses: cumulativeExpenses };
    });
  }, [filteredTransactions, selectedMonth, selectedYear]);

  function toggleCategoryCollapse(categoryId: string) {
    setCollapsedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(pointerSensor);

  if (loading || !user) return null;

  const totalIncomeCents = filteredTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
  const totalExpenseCents = filteredTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
  const balanceCents = totalIncomeCents - totalExpenseCents;
  const uncategorisedTransactions = filteredTransactions.filter(
    (transaction) => !transaction.categoryId,
  );

  function handleDragStart(event: DragStartEvent) {
    const draggedTransaction = displayedTransactions.find(
      (transaction) => transaction.id === event.active.id,
    );
    setActiveDragTransaction(draggedTransaction ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    setDragOverDroppableId(event.over ? String(event.over.id) : null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragTransaction(null);
    setDragOverDroppableId(null);

    const droppedTransactionId = String(event.active.id);
    if (!event.over) return;

    const targetCategoryId =
      event.over.id === 'uncategorised' ? null : String(event.over.id);

    const previousTransactions = transactions;
    setOptimisticTransactions(
      displayedTransactions.map((transaction) =>
        transaction.id === droppedTransactionId
          ? { ...transaction, categoryId: targetCategoryId }
          : transaction,
      ),
    );

    try {
      await assignCategory(db, droppedTransactionId, targetCategoryId);
    } catch {
      setOptimisticTransactions(previousTransactions);
    } finally {
      setOptimisticTransactions(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!transactionIdPendingDeletion) return;
    setDeleteError('');
    try {
      await deleteTransaction(db, transactionIdPendingDeletion);
    } catch {
      setDeleteError('Failed to delete transaction. Please try again.');
    } finally {
      setTransactionIdPendingDeletion(null);
    }
  }

  const isLoading = categoriesLoading || transactionsLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Link
              href={`/householdbooks/${bookId}/categories/new`}
              className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white text-base font-semibold px-5 py-3 rounded-2xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New category
            </Link>
            <Link
              href={`/householdbooks/${bookId}/transactions/new`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold px-5 py-3 rounded-2xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New transaction
            </Link>
          </div>
        </div>

        {deleteError && (
          <div className="mb-4">
            <ErrorBanner message={deleteError} />
          </div>
        )}
        {transactionsError && (
          <div className="mb-4">
            <ErrorBanner message="Failed to load transactions." />
          </div>
        )}

        <div className="grid gap-4 mb-6">
          <MonthSelector
            month={selectedMonth}
            year={selectedYear}
            onChange={({ month, year }) => {
              setSelectedMonth(month);
              setSelectedYear(year);
            }}
          />
          <TransactionStatistics
            totalIncomeCents={totalIncomeCents}
            totalExpenseCents={totalExpenseCents}
            balanceCents={balanceCents}
            transactionCount={filteredTransactions.length}
          />
        </div>

        <div className="mb-8">
          <CategoryCharts summaries={categoryBudgetSummaries} dailyData={dailyChartData} />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Categories
                </h2>
                {categoryBudgetSummaries.length === 0 ? (
                  <p className="text-slate-400 text-sm">
                    No categories yet.{' '}
                    <Link href={`/householdbooks/${bookId}/categories/new`} className="text-indigo-600 hover:underline">
                      Add one
                    </Link>
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {categoryBudgetSummaries.map((summary) => {
                      const isCollapsed = collapsedCategoryIds.includes(summary.id);
                      const categoryTransactions = filteredTransactions.filter(
                        (transaction) => transaction.categoryId === summary.id,
                      );
                      return (
                        <li key={summary.id}>
                          <DroppableCategoryCard
                            summary={summary}
                            bookId={bookId}
                            onDelete={(categoryId) => setTransactionIdPendingDeletion(categoryId)}
                            dragOverCategoryId={dragOverDroppableId}
                            isCollapsed={isCollapsed}
                            onToggleCollapse={() => toggleCategoryCollapse(summary.id)}
                            transactionCount={categoryTransactions.length}
                          />
                          {!isCollapsed && (
                            <ul className="mt-2 ml-2 space-y-1.5">
                              {categoryTransactions.map((transaction) => (
                                <li key={transaction.id}>
                                  <TransactionItem
                                    transaction={transaction}
                                    onEdit={(transaction) =>
                                      router.push(
                                        `/householdbooks/${bookId}/transactions/${transaction.id}/edit`,
                                      )
                                    }
                                    onDelete={(transactionId) =>
                                      setTransactionIdPendingDeletion(transactionId)
                                    }
                                    draggable
                                  />
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Uncategorised
                </h2>
                <DroppableUncategorisedZone
                  isActive={dragOverDroppableId === 'uncategorised'}
                >
                  {uncategorisedTransactions.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">
                      All transactions are categorised.
                    </p>
                  ) : (
                    <TransactionList
                      transactions={uncategorisedTransactions}
                      categories={categories}
                      onEdit={(transaction) =>
                        router.push(
                          `/householdbooks/${bookId}/transactions/${transaction.id}/edit`,
                        )
                      }
                      onDelete={(transactionId) =>
                        setTransactionIdPendingDeletion(transactionId)
                      }
                      draggable
                    />
                  )}
                </DroppableUncategorisedZone>
              </div>
            </div>

            <DragOverlay>
              {activeDragTransaction && (
                <div className="opacity-90 shadow-lg">
                  <TransactionItem
                    transaction={activeDragTransaction}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {transactionIdPendingDeletion && (
        <ConfirmDialog
          message="Delete this transaction? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setTransactionIdPendingDeletion(null)}
        />
      )}
    </div>
  );
}
