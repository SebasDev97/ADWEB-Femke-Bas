'use client';

import type { Transaction } from '@/types/transaction';
import type { Category } from '@/types/category';
import TransactionItem from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  draggable?: boolean;
}

export default function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  draggable = false,
}: TransactionListProps) {
  const categoryNameById = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No transactions yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {transactions.map((transaction) => (
        <li key={transaction.id}>
          <TransactionItem
            transaction={transaction}
            categoryName={
              transaction.categoryId
                ? categoryNameById[transaction.categoryId]
                : undefined
            }
            onEdit={onEdit}
            onDelete={onDelete}
            draggable={draggable}
          />
        </li>
      ))}
    </ul>
  );
}
