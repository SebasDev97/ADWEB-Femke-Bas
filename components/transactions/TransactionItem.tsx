'use client';

import { useDraggable } from '@dnd-kit/core';
import { centsToCurrencyString } from '@/utils/money';
import type { Transaction } from '@/types/transaction';

interface TransactionItemProps {
  transaction: Transaction;
  categoryName?: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  draggable?: boolean;
}

export default function TransactionItem({
  transaction,
  categoryName,
  onEdit,
  onDelete,
  draggable = false,
}: TransactionItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: transaction.id,
    disabled: !draggable,
  });

  const amountColourClass =
    transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
  const amountPrefix = transaction.type === 'income' ? '+' : '-';

  const dateLabel = transaction.date
    ? new Date(transaction.date.toMillis()).toLocaleDateString('nl-NL')
    : '';

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      className={`group flex items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 px-4 py-3 transition-all ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'opacity-40' : 'hover:border-slate-300 hover:shadow-sm'}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{transaction.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{dateLabel}</span>
          {categoryName && (
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
              {categoryName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-semibold ${amountColourClass}`}>
          {amountPrefix}{centsToCurrencyString(transaction.amountCents)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
