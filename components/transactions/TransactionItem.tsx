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
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-4 transition-all ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'opacity-40' : 'hover:border-slate-300 hover:shadow-sm'}`}
    >
      <div className="min-w-0">
        <p className="text-base font-semibold text-slate-900 truncate">{transaction.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-sm text-slate-500">{dateLabel}</span>
          {categoryName && (
            <span className="text-sm font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
              {categoryName}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:items-end items-start gap-3 shrink-0">
        <span className={`text-lg font-semibold ${amountColourClass}`}>
          {amountPrefix}{centsToCurrencyString(transaction.amountCents)}
        </span>
        <div className="flex flex-wrap items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="text-sm font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="text-sm font-semibold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
