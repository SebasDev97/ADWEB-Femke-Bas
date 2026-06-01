import type { Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  bookId: string;
  categoryId: string | null;
  type: TransactionType;
  amountCents: number;
  description: string;
  date: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'createdBy'>;
