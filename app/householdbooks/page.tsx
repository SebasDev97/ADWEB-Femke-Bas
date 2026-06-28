'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, updateDoc, doc, or, and, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import type { Householdbook } from '@/types/householdbook';
import Navbar from '@/components/Navbar';

export default function HuishoudboekjesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [books, setBooks] = useState<Householdbook[]>([]);
  const [fetching, setFetching] = useState(true);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Householdbook | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

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
          where('archived', '==', false),
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

  const archiveBook = async (id: string) => {
    await updateDoc(doc(db, 'householdbooks', id), { archived: true });
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const openInviteModal = async (book: Householdbook) => {
    setSelectedBook(book);
    setMembers(book.members ?? []);
    if (book.members?.length) {
      const emailMap: Record<string, string> = {};
      for (const uid of book.members) {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) emailMap[uid] = userSnap.data().email ?? uid;
      }
      setMemberEmails(emailMap);
    } else {
      setMemberEmails({});
    }
    setInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setSelectedBook(null);
    setMembers([]);
    setMemberEmails({});
    setInviteEmail('');
    setInviteError('');
  };

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBook || !user) return;

    setInviteError('');
    const email = inviteEmail.trim().toLowerCase();
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (snap.empty) { setInviteError('No user found with that email.'); return; }
      const invitedUid = snap.docs[0].id;
      if (invitedUid === user.uid || members.includes(invitedUid)) {
        setInviteError('This user is already a member.');
        return;
      }
      const newMembers = [...members, invitedUid];
      await updateDoc(doc(db, 'householdbooks', selectedBook.id), { members: newMembers });
      setMembers(newMembers);
      setMemberEmails((prev) => ({ ...prev, [invitedUid]: email }));
      setInviteEmail('');
    } catch (err: unknown) {
      if (err instanceof Error) setInviteError(err.message);
    }
  };

  const removeMember = async (uid: string) => {
    if (!selectedBook) return;
    const newMembers = members.filter((m) => m !== uid);
    await updateDoc(doc(db, 'householdbooks', selectedBook.id), { members: newMembers });
    setMembers(newMembers);
    setMemberEmails((prev) => {
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Household Books</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {books.length} {books.length === 1 ? 'book' : 'books'} active
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/householdbooks/archived"
              className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              Archived
            </Link>
            <Link
              href="/householdbooks/new"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New book
            </Link>
          </div>
        </div>

        {fetching ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold">No household books yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-5">Create your first book to get started.</p>
            <Link
              href="/householdbooks/new"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New book
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {books.map((book) => (
              <li
                key={book.id}
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/householdbooks/${book.id}/transactions`} className="flex items-start gap-3.5 min-w-0 hover:opacity-80 transition-opacity">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{book.name}</p>
                      {book.description && (
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{book.description}</p>
                      )}
                    </div>
                  </Link>

                  {book.ownerId === user.uid && (
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/householdbooks/${book.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => openInviteModal(book)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                        Invite
                      </button>
                      <button
                        onClick={() => archiveBook(book.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archive
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {inviteModalOpen && selectedBook && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-lg relative">
              <button onClick={closeInviteModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-lg font-semibold text-slate-800 mb-1">Invite Members</h2>
              <p className="text-sm text-slate-500 mb-6">To &quot;{selectedBook.name}&quot;</p>

              {members.length > 0 && (
                <ul className="divide-y divide-slate-100 mb-4 -mx-6 px-6 max-h-60 overflow-y-auto">
                  {members.map((uid) => (
                    <li key={uid} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 uppercase">
                          {(memberEmails[uid] ?? uid)[0]}
                        </div>
                        <span className="text-sm text-slate-700">{memberEmails[uid] ?? uid}</span>
                      </div>
                      <button
                        onClick={() => removeMember(uid)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {members.length === 0 && (
                <p className="text-sm text-slate-400 mb-4">No members invited yet.</p>
              )}

              {inviteError && (
                <div className="mb-3 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="Invite by email address"
                  className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  Invite
                </button>
              </form>

              <div className="mt-6 text-right">
                <button
                  onClick={closeInviteModal}
                  className="border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
