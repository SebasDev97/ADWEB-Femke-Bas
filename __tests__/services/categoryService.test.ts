import {
  createCategory,
  updateCategory,
  deleteCategory,
  subscribeToCategories,
} from '@/services/categoryService';

const mockCategoryRef = { id: 'cat-123' };
const mockBatch = {
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};
const mockUnsubscribe = jest.fn();

const mockCollectionRef = { type: 'collection' };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => mockCollectionRef),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn((_db, _collection, id) => ({ id })),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

import {
  addDoc,
  updateDoc,
  getDocs,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { testDb } from '../helpers/testFirestore';

const mockDb = testDb;

beforeEach(() => {
  jest.clearAllMocks();
  (writeBatch as jest.Mock).mockReturnValue(mockBatch);
  (addDoc as jest.Mock).mockResolvedValue(mockCategoryRef);
});

describe('createCategory', () => {
  it('calls addDoc with the correct shape including createdBy and serverTimestamp', async () => {
    const categoryInput = {
      bookId: 'book-1',
      name: 'Groceries',
      maxBudget: 5000,
      endDate: null,
    };

    const newCategoryId = await createCategory(mockDb, categoryInput, 'user-42');

    expect(addDoc).toHaveBeenCalledWith(expect.anything(), {
      bookId: 'book-1',
      name: 'Groceries',
      maxBudget: 5000,
      endDate: null,
      createdBy: 'user-42',
      createdAt: 'SERVER_TIMESTAMP',
    });
    expect(newCategoryId).toBe('cat-123');
  });
});

describe('updateCategory', () => {
  it('calls updateDoc with the provided patch', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await updateCategory(mockDb, 'cat-1', { name: 'Rent' });

    expect(updateDoc).toHaveBeenCalledWith({ id: 'cat-1' }, { name: 'Rent' });
  });
});

describe('deleteCategory', () => {
  it('nulls out categoryId on all linked transactions and deletes the category in a batch', async () => {
    const linkedTransactionDocs = [
      { ref: { id: 'tx-1' } },
      { ref: { id: 'tx-2' } },
    ];
    (getDocs as jest.Mock).mockResolvedValue({ docs: linkedTransactionDocs });

    await deleteCategory(mockDb, 'cat-1', 'book-1');

    expect(getDocs).toHaveBeenCalled();
    expect(mockBatch.update).toHaveBeenCalledWith({ id: 'tx-1' }, { categoryId: null });
    expect(mockBatch.update).toHaveBeenCalledWith({ id: 'tx-2' }, { categoryId: null });
    expect(mockBatch.delete).toHaveBeenCalledWith({ id: 'cat-1' });
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});

describe('subscribeToCategories', () => {
  it('maps Firestore documents to Category objects and calls onData', () => {
    const firestoreDocuments = [
      { id: 'cat-1', data: () => ({ bookId: 'book-1', name: 'Food', maxBudget: 3000, endDate: null, createdAt: 'ts', createdBy: 'u1' }) },
      { id: 'cat-2', data: () => ({ bookId: 'book-1', name: 'Transport', maxBudget: 1500, endDate: null, createdAt: 'ts', createdBy: 'u1' }) },
    ];
    (onSnapshot as jest.Mock).mockImplementation((_query, successCallback) => {
      successCallback({ docs: firestoreDocuments });
      return mockUnsubscribe;
    });

    const onData = jest.fn();
    const unsubscribe = subscribeToCategories(mockDb, 'book-1', onData, jest.fn());

    expect(onData).toHaveBeenCalledWith([
      { id: 'cat-1', bookId: 'book-1', name: 'Food', maxBudget: 3000, endDate: null, createdAt: 'ts', createdBy: 'u1' },
      { id: 'cat-2', bookId: 'book-1', name: 'Transport', maxBudget: 1500, endDate: null, createdAt: 'ts', createdBy: 'u1' },
    ]);
    expect(unsubscribe).toBe(mockUnsubscribe);
  });
});
