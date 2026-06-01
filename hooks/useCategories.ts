import { useEffect, useState } from 'react';
import { db } from '@/config/firebase';
import { subscribeToCategories } from '@/services/categoryService';
import type { Category } from '@/types/category';

export function useCategories(bookId: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!bookId) return;
    const unsubscribe = subscribeToCategories(
      db,
      bookId,
      (fetchedCategories) => {
        setCategories(fetchedCategories);
        setLoading(false);
      },
      (fetchError) => {
        setError(fetchError);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [bookId]);

  return { categories, loading, error };
}
