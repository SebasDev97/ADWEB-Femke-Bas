import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';
import type { Transaction, TransactionInput } from '@/types/transaction';

function docToTransaction(id: string, docData: DocumentData): Transaction {
  return { id, ...docData } as Transaction;
}

export async function createTransaction(
  db: Firestore,
  input: TransactionInput,
  uid: string,
): Promise<string> {
  const newTransactionRef = await addDoc(collection(db, 'transactions'), {
    ...input,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return newTransactionRef.id;
}

export async function updateTransaction(
  db: Firestore,
  transactionId: string,
  patch: Partial<TransactionInput>,
): Promise<void> {
  await updateDoc(doc(db, 'transactions', transactionId), patch);
}

export async function deleteTransaction(
  db: Firestore,
  transactionId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'transactions', transactionId));
}

export async function assignCategory(
  db: Firestore,
  transactionId: string,
  categoryId: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'transactions', transactionId), { categoryId });
}

export function subscribeToTransactions(
  db: Firestore,
  bookId: string,
  onData: (transactions: Transaction[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('bookId', '==', bookId),
    orderBy('date', 'desc'),
  );
  return onSnapshot(
    transactionsQuery,
    (snapshot) =>
      onData(
        snapshot.docs.map((transactionDoc) =>
          docToTransaction(transactionDoc.id, transactionDoc.data()),
        ),
      ),
    onError,
  );
}
