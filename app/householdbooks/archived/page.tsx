'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, updateDoc, doc, or, and } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import type { Householdbook } from '@/types/householdbook';
import Navbar from '@/components/Navbar';

export default function ArchivedHuishoudboekjesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [books, setBooks] = useState<Householdbook[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchBooks() {
      setFetching(true);
      const q = query(
        collection(db, 'householdbooks'),
        and(
          where('archived', '==', true),
          or(
            where('ownerId', '==', user!.uid),
            where('members', 'array-contains', user!.uid)
          )
        )
      );
      const snapshot = await getDocs(q);
      setBooks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Householdbook)));
      setFetching(false);
    }

    fetchBooks();
  }, [user]);

  const restoreBook = async (id: string) => {
    await updateDoc(doc(db, 'householdbooks', id), { archived: false });
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/householdbooks"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to overview
          </Link>
          <h1 className="text-xl font-bold text-slate-900 mt-3">Archived Books</h1>
          <p className="text-sm text-slate-500 mt-0.5">Books you have archived are shown here and can be restored.</p>
        </div>

        {fetching ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-2xl mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold">No archived books</p>
            <p className="text-slate-400 text-sm mt-1">Books you archive will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {books.map((book) => (
              <li key={book.id} className="group bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-500 truncate">{book.name}</p>
                      {book.description && (
                        <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{book.description}</p>
                      )}
                    </div>
                  </div>

                  {book.ownerId === user.uid && (
                    <button
                      onClick={() => restoreBook(book.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restore
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
