import type { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  bookId: string;
  name: string;
  maxBudget: number;
  endDate: Timestamp | null;
  createdAt: Timestamp;
  createdBy: string;
}

export type CategoryInput = Omit<Category, 'id' | 'createdAt' | 'createdBy'>;
