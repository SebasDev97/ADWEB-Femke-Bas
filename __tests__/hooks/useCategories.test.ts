import { renderHook } from '@testing-library/react';
import { useCategories } from '@/hooks/useCategories';

jest.mock('@/config/firebase', () => ({ db: {} }));
jest.mock('@/services/categoryService');

import { subscribeToCategories } from '@/services/categoryService';

const mockUnsubscribe = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCategories', () => {
  it('starts with loading true and empty categories', () => {
    (subscribeToCategories as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useCategories('book-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.categories).toEqual([]);
  });

  it('sets categories and loading false when subscription delivers data', () => {
    const fetchedCategories = [
      { id: 'cat-1', bookId: 'book-1', name: 'Food', maxBudget: 5000, endDate: null, createdAt: null, createdBy: 'u1' },
    ];
    (subscribeToCategories as jest.Mock).mockImplementation(
      (_db, _bookId, onData) => {
        onData(fetchedCategories);
        return mockUnsubscribe;
      },
    );

    const { result } = renderHook(() => useCategories('book-1'));

    expect(result.current.loading).toBe(false);
    expect(result.current.categories).toEqual(fetchedCategories);
  });

  it('unsubscribes when the component unmounts', () => {
    (subscribeToCategories as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useCategories('book-1'));
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('does not subscribe when bookId is null', () => {
    const { result } = renderHook(() => useCategories(null));

    expect(subscribeToCategories).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });
});
