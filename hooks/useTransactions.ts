import { useEffect, useState } from 'react';
import { db } from '@/config/firebase';
import { subscribeToTransactions } from '@/services/transactionService';
import type { Transaction } from '@/types/transaction';

export function useTransactions(bookId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!bookId) return;
    const unsubscribe = subscribeToTransactions(
      db,
      bookId,
      (fetchedTransactions) => {
        setTransactions(fetchedTransactions);
        setLoading(false);
      },
      (fetchError) => {
        setError(fetchError);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [bookId]);

  return { transactions, loading, error };
}
