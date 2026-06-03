'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { updateCategory } from '@/services/categoryService';
import { euroStringToCents } from '@/utils/money';
import CategoryForm, { CategoryFormValues } from '@/components/categories/CategoryForm';
import type { Category } from '@/types/category';
import Navbar from '@/components/Navbar';

export default function EditCategoryPage() {
  const router = useRouter();
  const { id: bookId, categoryId } = useParams<{ id: string; categoryId: string }>();
  const { user, loading } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!user) return;
    async function fetchCategory() {
      const categorySnapshot = await getDoc(doc(db, 'categories', categoryId));
      if (categorySnapshot.exists()) {
        setCategory({ id: categorySnapshot.id, ...categorySnapshot.data() } as Category);
      }
      setFetching(false);
    }
    fetchCategory();
  }, [user, categoryId]);

  if (loading || !user) return null;

  const initialFormValues: CategoryFormValues | undefined = category
    ? {
        name: category.name,
        maxBudgetEuros: (category.maxBudget / 100).toFixed(2),
        endDate: category.endDate
          ? new Date(category.endDate.toMillis()).toISOString().split('T')[0]
          : '',
      }
    : undefined;

  async function handleSubmit(formValues: CategoryFormValues) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const endDate = formValues.endDate
        ? Timestamp.fromDate(new Date(formValues.endDate))
        : null;
      await updateCategory(db, categoryId, {
        name: formValues.name,
        maxBudget: euroStringToCents(formValues.maxBudgetEuros),
        endDate,
      });
      router.push(`/householdbooks/${bookId}/transactions`);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Edit category</h1>
        {submitError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
        {fetching ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <CategoryForm
              initial={initialFormValues}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/householdbooks/${bookId}/transactions`)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
