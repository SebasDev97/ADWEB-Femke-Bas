import {
  subscribeToActiveBooks,
  archiveBook,
  getMemberEmails,
  lookupUserByEmail,
  updateBookMembers,
} from '@/services/householdbookService';

const mockUnsubscribe = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn((_db, _col, id) => ({ id })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
}));

import {
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { testDb } from '../helpers/testFirestore';

const mockDb = testDb;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('subscribeToActiveBooks', () => {
  it('maps snapshot docs to Householdbook objects and calls onData', () => {
    const firestoreDocs = [
      {
        id: 'book-1',
        data: () => ({ name: 'Home', description: '', ownerId: 'u1', archived: false, members: [], createdAt: 'ts' }),
      },
      {
        id: 'book-2',
        data: () => ({ name: 'Travel', description: 'trips', ownerId: 'u2', archived: false, members: ['u1'], createdAt: 'ts' }),
      },
    ];
    (onSnapshot as jest.Mock).mockImplementation((_query, successCallback) => {
      successCallback({ docs: firestoreDocs });
      return mockUnsubscribe;
    });

    const onData = jest.fn();
    const unsubscribe = subscribeToActiveBooks(mockDb, 'u1', onData, jest.fn());

    expect(onData).toHaveBeenCalledWith([
      { id: 'book-1', name: 'Home', description: '', ownerId: 'u1', archived: false, members: [], createdAt: 'ts' },
      { id: 'book-2', name: 'Travel', description: 'trips', ownerId: 'u2', archived: false, members: ['u1'], createdAt: 'ts' },
    ]);
    expect(unsubscribe).toBe(mockUnsubscribe);
  });

  it('calls onError when the snapshot fails', () => {
    const error = new Error('permission denied');
    (onSnapshot as jest.Mock).mockImplementation((_query, _onSuccess, onError) => {
      onError(error);
      return mockUnsubscribe;
    });

    const onError = jest.fn();
    subscribeToActiveBooks(mockDb, 'u1', jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(error);
  });
});

describe('archiveBook', () => {
  it('calls updateDoc with archived: true', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await archiveBook(mockDb, 'book-1');

    expect(updateDoc).toHaveBeenCalledWith({ id: 'book-1' }, { archived: true });
  });
});

describe('getMemberEmails', () => {
  it('returns a uid→email map for existing users', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ email: 'alice@example.com' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ email: 'bob@example.com' }) });

    const result = await getMemberEmails(mockDb, ['uid-alice', 'uid-bob']);

    expect(result).toEqual({ 'uid-alice': 'alice@example.com', 'uid-bob': 'bob@example.com' });
  });

  it('falls back to the uid when the user doc does not exist', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

    const result = await getMemberEmails(mockDb, ['uid-ghost']);

    expect(result).toEqual({ 'uid-ghost': 'uid-ghost' });
  });

  it('returns an empty object for an empty uid list', async () => {
    const result = await getMemberEmails(mockDb, []);
    expect(result).toEqual({});
    expect(getDoc).not.toHaveBeenCalled();
  });
});

describe('lookupUserByEmail', () => {
  it('returns the uid when a matching user is found', async () => {
    (getDocs as jest.Mock).mockResolvedValue({ empty: false, docs: [{ id: 'uid-alice' }] });

    const uid = await lookupUserByEmail(mockDb, 'alice@example.com');

    expect(uid).toBe('uid-alice');
  });

  it('returns null when no user matches the email', async () => {
    (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });

    const uid = await lookupUserByEmail(mockDb, 'nobody@example.com');

    expect(uid).toBeNull();
  });
});

describe('updateBookMembers', () => {
  it('calls updateDoc with the provided members array', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await updateBookMembers(mockDb, 'book-1', ['uid-alice', 'uid-bob']);

    expect(updateDoc).toHaveBeenCalledWith({ id: 'book-1' }, { members: ['uid-alice', 'uid-bob'] });
  });
});
