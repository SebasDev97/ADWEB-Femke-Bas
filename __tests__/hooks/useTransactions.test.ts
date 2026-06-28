import { renderHook } from '@testing-library/react';
import { useTransactions } from '@/hooks/useTransactions';

jest.mock('@/config/firebase', () => ({ db: {} }));
jest.mock('@/services/transactionService');

import { subscribeToTransactions } from '@/services/transactionService';

const mockUnsubscribe = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTransactions', () => {
  it('starts with loading true and empty transactions', () => {
    (subscribeToTransactions as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useTransactions('book-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.transactions).toEqual([]);
  });

  it('sets transactions and loading false when subscription delivers data', () => {
    const fetchedTransactions = [
      { id: 'tx-1', bookId: 'book-1', categoryId: null, type: 'expense', amountCents: 1000, description: 'Coffee', date: null, createdAt: null, createdBy: 'u1' },
    ];
    (subscribeToTransactions as jest.Mock).mockImplementation(
      (_db, _bookId, onData) => {
        onData(fetchedTransactions);
        return mockUnsubscribe;
      },
    );

    const { result } = renderHook(() => useTransactions('book-1'));

    expect(result.current.loading).toBe(false);
    expect(result.current.transactions).toEqual(fetchedTransactions);
  });

  it('unsubscribes when the component unmounts', () => {
    (subscribeToTransactions as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useTransactions('book-1'));
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('does not subscribe when bookId is null', () => {
    const { result } = renderHook(() => useTransactions(null));

    expect(subscribeToTransactions).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });
});
