'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategoryBudget } from '@/hooks/useCategoryBudget';
import { deleteCategory } from '@/services/categoryService';
import CategoryList from '@/components/categories/CategoryList';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ErrorBanner from '@/components/ui/ErrorBanner';
import Navbar from '@/components/Navbar';

export default function BookDetailPage() {
  const { id: bookId } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const authedBookId = !loading && user ? bookId : null;
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories(authedBookId);
  const { transactions, loading: transactionsLoading } = useTransactions(authedBookId);

  const categoryBudgetSummaries = useCategoryBudget(categories, transactions);

  const [categoryIdPendingDeletion, setCategoryIdPendingDeletion] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  if (loading || !user) return null;

  async function handleDeleteConfirmed() {
    if (!categoryIdPendingDeletion) return;
    setDeleteError('');
    try {
      await deleteCategory(db, categoryIdPendingDeletion, bookId);
    } catch {
      setDeleteError('Failed to delete category. Please try again.');
    } finally {
      setCategoryIdPendingDeletion(null);
    }
  }

  const isLoading = categoriesLoading || transactionsLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/householdbooks')}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors mb-1 flex items-center gap-1"
            >
              ← Books
            </button>
            <h1 className="text-xl font-bold text-slate-900">Categories</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/householdbooks/${bookId}/transactions`}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              Transactions
            </Link>
            <Link
              href={`/householdbooks/${bookId}/categories/new`}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New category
            </Link>
          </div>
        </div>

        {deleteError && (
          <div className="mb-4">
            <ErrorBanner message={deleteError} />
          </div>
        )}

        {categoriesError && (
          <div className="mb-4">
            <ErrorBanner message="Failed to load categories." />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-2 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <CategoryList
            summaries={categoryBudgetSummaries}
            bookId={bookId}
            onDelete={(categoryId) => setCategoryIdPendingDeletion(categoryId)}
          />
        )}
      </main>

      {categoryIdPendingDeletion && (
        <ConfirmDialog
          message="Delete this category? All linked transactions will be uncategorised."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setCategoryIdPendingDeletion(null)}
        />
      )}
    </div>
  );
}
