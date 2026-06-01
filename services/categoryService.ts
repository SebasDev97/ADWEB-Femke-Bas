import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';
import type { Category, CategoryInput } from '@/types/category';

function docToCategory(id: string, docData: DocumentData): Category {
  return { id, ...docData } as Category;
}

export async function createCategory(
  db: Firestore,
  input: CategoryInput,
  uid: string,
): Promise<string> {
  const newCategoryRef = await addDoc(collection(db, 'categories'), {
    ...input,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return newCategoryRef.id;
}

export async function updateCategory(
  db: Firestore,
  categoryId: string,
  patch: Partial<CategoryInput>,
): Promise<void> {
  await updateDoc(doc(db, 'categories', categoryId), patch);
}

export async function deleteCategory(
  db: Firestore,
  categoryId: string,
  bookId: string,
): Promise<void> {
  const linkedTransactionsSnapshot = await getDocs(
    query(
      collection(db, 'transactions'),
      where('bookId', '==', bookId),
      where('categoryId', '==', categoryId),
    ),
  );
  const batch = writeBatch(db);
  linkedTransactionsSnapshot.docs.forEach((transactionDoc) =>
    batch.update(transactionDoc.ref, { categoryId: null }),
  );
  batch.delete(doc(db, 'categories', categoryId));
  await batch.commit();
}

export function subscribeToCategories(
  db: Firestore,
  bookId: string,
  onData: (categories: Category[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const categoriesQuery = query(
    collection(db, 'categories'),
    where('bookId', '==', bookId),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(
    categoriesQuery,
    (snapshot) =>
      onData(snapshot.docs.map((categoryDoc) => docToCategory(categoryDoc.id, categoryDoc.data()))),
    onError,
  );
}
