'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsLegend } from '@mui/x-charts/ChartsLegend';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import type { CategoryBudgetSummary } from '@/hooks/useCategoryBudget';

interface CategoryChartsProps {
  summaries: CategoryBudgetSummary[];
  dailyData: { day: string; expenses: number; income: number }[];
}

export default function CategoryCharts({ summaries, dailyData }: CategoryChartsProps) {
  const barChartData = summaries.map((summary) => summary.spentCents / 100);
  const barChartXLabels = summaries.map((summary) => summary.name);

  const lineChartHasData = dailyData && dailyData.length > 0;
  const lineChartSeries = lineChartHasData
    ? [{ data: dailyData.map((d) => d.income), label: 'Income', color: '#16a34a' }, { data: dailyData.map((d) => d.expenses), label: 'Expenses', color: '#dc2626' }]
    : [];
  const lineChartXLabels = lineChartHasData ? dailyData.map((d) => d.day) : [];

  const euroFormatter = (value: number | null) => (value === null ? '' : `€${value}`);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Expenses per category</h3>
        <div style={{ width: '100%', height: 300 }}>
          <BarChart
            series={[{ data: barChartData, label: 'Expenses', color: '#4f46e5' }]}
            xAxis={[{ scaleType: 'band', data: barChartXLabels }]}
            yAxis={[{ valueFormatter: euroFormatter }]}
            margin={{ top: 10, right: 20, bottom: 30, left: 50 }}
          >
            <ChartsGrid horizontal />
          </BarChart>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Cumulative balance per day</h3>
        <div style={{ width: '100%', height: 300 }}>
          {lineChartHasData ? (
            <LineChart
              series={lineChartSeries}
              xAxis={[{ scaleType: 'band', data: lineChartXLabels }]}
              yAxis={[{ valueFormatter: euroFormatter }]}
              margin={{ top: 10, right: 20, bottom: 30, left: 50 }}
            >
              <ChartsGrid horizontal />
              <ChartsLegend />
            </LineChart>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>No data to show graph.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
