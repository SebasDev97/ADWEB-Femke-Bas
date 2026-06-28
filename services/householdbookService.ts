import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  and,
  or,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import type { Householdbook } from '@/types/householdbook';

function docToHouseholdbook(id: string, docData: DocumentData): Householdbook {
  return { id, ...docData } as Householdbook;
}

export function subscribeToActiveBooks(
  db: Firestore,
  userId: string,
  onData: (books: Householdbook[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const booksQuery = query(
    collection(db, 'householdbooks'),
    and(
      where('archived', '==', false),
      or(
        where('ownerId', '==', userId),
        where('members', 'array-contains', userId),
      ),
    ),
  );
  return onSnapshot(
    booksQuery,
    (snapshot) =>
      onData(snapshot.docs.map((bookDoc) => docToHouseholdbook(bookDoc.id, bookDoc.data()))),
    onError,
  );
}

export async function archiveBook(db: Firestore, bookId: string): Promise<void> {
  await updateDoc(doc(db, 'householdbooks', bookId), { archived: true });
}

export async function getMemberEmails(
  db: Firestore,
  memberUids: string[],
): Promise<Record<string, string>> {
  const emailMap: Record<string, string> = {};
  for (const uid of memberUids) {
    const userSnap = await getDoc(doc(db, 'users', uid));
    emailMap[uid] = userSnap.exists() ? (userSnap.data().email ?? uid) : uid;
  }
  return emailMap;
}

export async function lookupUserByEmail(
  db: Firestore,
  email: string,
): Promise<string | null> {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function updateBookMembers(
  db: Firestore,
  bookId: string,
  members: string[],
): Promise<void> {
  await updateDoc(doc(db, 'householdbooks', bookId), { members });
}
