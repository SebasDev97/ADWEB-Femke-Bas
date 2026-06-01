'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { createTransaction } from '@/services/transactionService';
import { euroStringToCents } from '@/utils/money';
import TransactionForm, { TransactionFormValues } from '@/components/transactions/TransactionForm';
import Navbar from '@/components/Navbar';

export default function NewTransactionPage() {
  const router = useRouter();
  const { id: bookId } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { categories } = useCategories(bookId);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (loading || !user) return null;

  async function handleSubmit(formValues: TransactionFormValues) {
    setSubmitting(true);
    setSubmitError('');
    try {
      await createTransaction(
        db,
        {
          bookId,
          categoryId: formValues.categoryId || null,
          type: formValues.type,
          amountCents: euroStringToCents(formValues.amountEuros),
          description: formValues.description,
          date: Timestamp.fromDate(new Date(formValues.date)),
        },
        user!.uid,
      );
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
        <h1 className="text-xl font-bold text-slate-900 mb-6">New transaction</h1>
        {submitError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <TransactionForm
            categories={categories}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/householdbooks/${bookId}/transactions`)}
          />
        </div>
      </main>
    </div>
  );
}
