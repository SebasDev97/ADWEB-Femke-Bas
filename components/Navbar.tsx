'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/householdbooks" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 bg-indigo-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-semibold text-slate-800 text-sm">Household Books</span>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <span className="text-xs text-slate-400 hidden sm:block truncate max-w-48">
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
