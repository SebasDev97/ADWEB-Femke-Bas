'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, getDocs, updateDoc, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import type { Householdbook } from '@/types/householdbook';
import Navbar from '@/components/Navbar';

export default function EditHuishoudboekjePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !id) return;

    async function load() {
      const snap = await getDoc(doc(db, 'householdbooks', id));
      if (!snap.exists()) { router.replace('/householdbooks'); return; }
      const data = snap.data() as Omit<Householdbook, 'id'>;
      if (data.ownerId !== user!.uid) { router.replace('/householdbooks'); return; }

      setName(data.name);
      setDescription(data.description ?? '');
      setMembers(data.members ?? []);

      if (data.members?.length) {
        const emailMap: Record<string, string> = {};
        for (const uid of data.members) {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) emailMap[uid] = userSnap.data().email ?? uid;
        }
        setMemberEmails(emailMap);
      }
      setFetching(false);
    }

    load();
  }, [user, id, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'householdbooks', id), { name, description });
      router.push('/householdbooks');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      setSubmitting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteError('');
    const email = inviteEmail.trim().toLowerCase();
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (snap.empty) { setInviteError('No user found with that email.'); return; }
      const invitedUid = snap.docs[0].id;
      if (invitedUid === user!.uid || members.includes(invitedUid)) {
        setInviteError('This user is already a member.');
        return;
      }
      const newMembers = [...members, invitedUid];
      await updateDoc(doc(db, 'householdbooks', id), { members: newMembers });
      setMembers(newMembers);
      setMemberEmails((prev) => ({ ...prev, [invitedUid]: email }));
      setInviteEmail('');
    } catch (err: unknown) {
      if (err instanceof Error) setInviteError(err.message);
    }
  };

  const removeMember = async (uid: string) => {
    const newMembers = members.filter((m) => m !== uid);
    await updateDoc(doc(db, 'householdbooks', id), { members: newMembers });
    setMembers(newMembers);
    setMemberEmails((prev) => { const next = { ...prev }; delete next[uid]; return next; });
  };

  if (loading || !user || fetching) return null;

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
            Back
          </Link>
          <h1 className="text-xl font-bold text-slate-900 mt-3">Edit Household Book</h1>
        </div>

        <div className="space-y-5 max-w-lg">
          {/* Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Details</h2>

            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                  <span className="ml-1.5 text-xs font-normal text-slate-400">optional</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Link
                  href="/householdbooks"
                  className="flex-1 text-center border border-slate-300 text-slate-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  {submitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Members */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Members</h2>

            {members.length > 0 && (
              <ul className="divide-y divide-slate-100 mb-4 -mx-6 px-6">
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
          </div>
        </div>
      </main>
    </div>
  );
}
