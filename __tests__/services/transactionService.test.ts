import {
  createTransaction,
  assignCategory,
  subscribeToTransactions,
} from '@/services/transactionService';

const mockTransactionRef = { id: 'tx-123' };
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
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

import { addDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { testDb } from '../helpers/testFirestore';

const { Timestamp: ActualTimestamp } = jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore');
const stubTimestamp: Timestamp = new ActualTimestamp(0, 0);

const mockDb = testDb;

beforeEach(() => {
  jest.clearAllMocks();
  (addDoc as jest.Mock).mockResolvedValue(mockTransactionRef);
});

describe('createTransaction', () => {
  it('calls addDoc with the correct shape including createdBy and serverTimestamp', async () => {
    const transactionInput = {
      bookId: 'book-1',
      categoryId: 'cat-1',
      type: 'expense' as const,
      amountCents: 2500,
      description: 'Groceries at AH',
      date: stubTimestamp,
    };

    const newTransactionId = await createTransaction(mockDb, transactionInput, 'user-42');

    expect(addDoc).toHaveBeenCalledWith(expect.anything(), {
      bookId: 'book-1',
      categoryId: 'cat-1',
      type: 'expense',
      amountCents: 2500,
      description: 'Groceries at AH',
      date: stubTimestamp,
      createdBy: 'user-42',
      createdAt: 'SERVER_TIMESTAMP',
    });
    expect(newTransactionId).toBe('tx-123');
  });
});

describe('assignCategory', () => {
  it('updates the transaction with the given categoryId', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await assignCategory(mockDb, 'tx-1', 'cat-5');

    expect(updateDoc).toHaveBeenCalledWith({ id: 'tx-1' }, { categoryId: 'cat-5' });
  });

  it('sets categoryId to null to unassign a category', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await assignCategory(mockDb, 'tx-1', null);

    expect(updateDoc).toHaveBeenCalledWith({ id: 'tx-1' }, { categoryId: null });
  });
});

describe('subscribeToTransactions', () => {
  it('maps Firestore documents to Transaction objects and calls onData', () => {
    const firestoreDocuments = [
      {
        id: 'tx-1',
        data: () => ({
          bookId: 'book-1',
          categoryId: null,
          type: 'expense',
          amountCents: 1000,
          description: 'Coffee',
          date: 'TIMESTAMP',
          createdAt: 'TIMESTAMP',
          createdBy: 'u1',
        }),
      },
    ];
    (onSnapshot as jest.Mock).mockImplementation((_query, successCallback) => {
      successCallback({ docs: firestoreDocuments });
      return mockUnsubscribe;
    });

    const onData = jest.fn();
    const unsubscribe = subscribeToTransactions(mockDb, 'book-1', onData, jest.fn());

    expect(onData).toHaveBeenCalledWith([
      {
        id: 'tx-1',
        bookId: 'book-1',
        categoryId: null,
        type: 'expense',
        amountCents: 1000,
        description: 'Coffee',
        date: 'TIMESTAMP',
        createdAt: 'TIMESTAMP',
        createdBy: 'u1',
      },
    ]);
    expect(unsubscribe).toBe(mockUnsubscribe);
  });
});
