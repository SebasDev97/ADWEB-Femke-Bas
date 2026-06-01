'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { updateTransaction } from '@/services/transactionService';
import { euroStringToCents } from '@/utils/money';
import TransactionForm, { TransactionFormValues } from '@/components/transactions/TransactionForm';
import type { Transaction } from '@/types/transaction';
import Navbar from '@/components/Navbar';

export default function EditTransactionPage() {
  const router = useRouter();
  const { id: bookId, transactionId } = useParams<{ id: string; transactionId: string }>();
  const { user, loading } = useAuth();
  const { categories } = useCategories(bookId);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!user) return;
    async function fetchTransaction() {
      const transactionSnapshot = await getDoc(doc(db, 'transactions', transactionId));
      if (transactionSnapshot.exists()) {
        setTransaction({ id: transactionSnapshot.id, ...transactionSnapshot.data() } as Transaction);
      }
      setFetching(false);
    }
    fetchTransaction();
  }, [user, transactionId]);

  if (loading || !user) return null;

  const initialFormValues: TransactionFormValues | undefined = transaction
    ? {
        type: transaction.type,
        amountEuros: (transaction.amountCents / 100).toFixed(2),
        description: transaction.description,
        date: new Date(transaction.date.toMillis()).toISOString().split('T')[0],
        categoryId: transaction.categoryId ?? '',
      }
    : undefined;

  async function handleSubmit(formValues: TransactionFormValues) {
    setSubmitting(true);
    setSubmitError('');
    try {
      await updateTransaction(db, transactionId, {
        type: formValues.type,
        amountCents: euroStringToCents(formValues.amountEuros),
        description: formValues.description,
        date: Timestamp.fromDate(new Date(formValues.date)),
        categoryId: formValues.categoryId || null,
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
        <h1 className="text-xl font-bold text-slate-900 mb-6">Edit transaction</h1>
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
            <TransactionForm
              initial={initialFormValues}
              categories={categories}
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
