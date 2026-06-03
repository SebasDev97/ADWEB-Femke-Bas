'use client';

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (value: { month: number; year: number }) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  function goToPreviousMonth() {
    if (month === 0) {
      onChange({ month: 11, year: year - 1 });
      return;
    }
    onChange({ month: month - 1, year });
  }

  function goToNextMonth() {
    if (month === 11) {
      onChange({ month: 0, year: year + 1 });
      return;
    }
    onChange({ month: month + 1, year });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
        >
          ←
        </button>
        <div className="text-base font-semibold text-slate-900">
          {MONTH_NAMES[month]} {year}
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
        >
          →
        </button>
      </div>
      <p className="text-sm text-slate-500">View transactions for the selected month.</p>
    </div>
  );
}
