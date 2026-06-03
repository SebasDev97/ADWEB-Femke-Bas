'use client';

import { centsToCurrencyString } from '@/utils/money';

interface TransactionStatisticsProps {
  totalIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;
  transactionCount: number;
}

export default function TransactionStatistics({
  totalIncomeCents,
  totalExpenseCents,
  balanceCents,
  transactionCount,
}: TransactionStatisticsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 min-h-[120px] shadow-sm">
        <p className="text-sm font-medium text-slate-500">Income</p>
        <p className="mt-2 text-2xl font-semibold text-green-600 leading-tight">{centsToCurrencyString(totalIncomeCents)}</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 min-h-[120px] shadow-sm">
        <p className="text-sm font-medium text-slate-500">Expenses</p>
        <p className="mt-2 text-2xl font-semibold text-red-600 leading-tight">{centsToCurrencyString(totalExpenseCents)}</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 min-h-[120px] shadow-sm">
        <p className="text-sm font-medium text-slate-500">Balance</p>
        <p
          className={`mt-2 text-2xl font-semibold leading-tight ${
            balanceCents >= 0 ? 'text-slate-900' : 'text-red-600'
          }`}
        >
          {centsToCurrencyString(balanceCents)}
        </p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 min-h-[120px] shadow-sm">
        <p className="text-sm font-medium text-slate-500">Transactions</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900 leading-tight">{transactionCount}</p>
      </div>
    </div>
  );
}
