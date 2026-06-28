'use client';

import { useState } from 'react';
import type { Category } from '@/types/category';
import type { TransactionType } from '@/types/transaction';

export interface TransactionFormValues {
  type: TransactionType;
  amountEuros: string;
  description: string;
  date: string;
  categoryId: string;
}

interface TransactionFormProps {
  initial?: Partial<TransactionFormValues>;
  categories: Category[];
  submitting: boolean;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  initial = {},
  categories,
  submitting,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>(
    initial.type ?? 'expense',
  );
  const [amountEuros, setAmountEuros] = useState(initial.amountEuros ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [date, setDate] = useState(
    initial.date ?? new Date().toISOString().split('T')[0],
  );
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? '');
  const [validationError, setValidationError] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError('');

    if (!description.trim()) {
      setValidationError('Description is required.');
      return;
    }
    const parsedAmount = parseFloat(amountEuros.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Amount must be a positive number.');
      return;
    }
    if (!date) {
      setValidationError('Date is required.');
      return;
    }

    onSubmit({ type: transactionType, amountEuros, description: description.trim(), date, categoryId });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
        <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm font-medium">
          {(['expense', 'income'] as TransactionType[]).map((typeOption) => (
            <button
              key={typeOption}
              type="button"
              onClick={() => setTransactionType(typeOption)}
              className={`flex-1 py-2 capitalize transition-colors ${
                transactionType === typeOption
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {typeOption}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="transaction-amount">
          Amount (€)
        </label>
        <input
          id="transaction-amount"
          type="number"
          value={amountEuros}
          onChange={(e) => setAmountEuros(e.target.value)}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="transaction-description">
          Description
        </label>
        <input
          id="transaction-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Weekly groceries"
          className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="transaction-date">
          Date
        </label>
        <input
          id="transaction-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="transaction-category">
          Category <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <select
          id="transaction-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        >
          <option value="">Uncategorised</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 text-center border border-slate-300 text-slate-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {submitting ? 'Saving…' : 'Save transaction'}
        </button>
      </div>
    </form>
  );
}
