'use client';

import { useState } from 'react';

export interface CategoryFormValues {
  name: string;
  maxBudgetEuros: string;
  endDate: string;
}

interface CategoryFormProps {
  initial?: Partial<CategoryFormValues>;
  submitting: boolean;
  onSubmit: (values: CategoryFormValues) => void;
  onCancel: () => void;
}

export default function CategoryForm({
  initial = {},
  submitting,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initial.name ?? '');
  const [maxBudgetEuros, setMaxBudgetEuros] = useState(initial.maxBudgetEuros ?? '');
  const [endDate, setEndDate] = useState(initial.endDate ?? '');
  const [validationError, setValidationError] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Name is required.');
      return;
    }
    const parsedBudget = parseFloat(maxBudgetEuros.replace(',', '.'));
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      setValidationError('Maximum budget must be a positive number.');
      return;
    }

    onSubmit({ name: name.trim(), maxBudgetEuros, endDate });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="category-name">
          Name
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="category-budget">
          Maximum budget (€)
        </label>
        <input
          id="category-budget"
          type="number"
          value={maxBudgetEuros}
          onChange={(e) => setMaxBudgetEuros(e.target.value)}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="category-end-date">
          End date <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          id="category-end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
