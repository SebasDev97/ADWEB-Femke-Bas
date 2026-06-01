'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { createCategory } from '@/services/categoryService';
import { euroStringToCents } from '@/utils/money';
import CategoryForm, { CategoryFormValues } from '@/components/categories/CategoryForm';
import Navbar from '@/components/Navbar';

export default function NewCategoryPage() {
  const router = useRouter();
  const { id: bookId } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (loading || !user) return null;

  async function handleSubmit(formValues: CategoryFormValues) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const endDate = formValues.endDate
        ? Timestamp.fromDate(new Date(formValues.endDate))
        : null;
      await createCategory(
        db,
        {
          bookId,
          name: formValues.name,
          maxBudget: euroStringToCents(formValues.maxBudgetEuros),
          endDate,
        },
        user!.uid,
      );
      router.push(`/householdbooks/${bookId}`);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">New category</h1>
        {submitError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <CategoryForm
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/householdbooks/${bookId}`)}
          />
        </div>
      </main>
    </div>
  );
}
