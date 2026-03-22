import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  TrendingUp,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type {
  TaxCalculationResult,
  TaxQuarter,
  MTDExportJson,
} from '../types';

export default function Reports() {
  const [quarters, setQuarters] = useState<TaxQuarter[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<TaxQuarter | null>(null);
  const [taxData, setTaxData] = useState<TaxCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');

  const loadQuarters = useCallback(async () => {
    try {
      const q = await window.ipcRenderer.invoke('tax:get-quarters');
      setQuarters(q);
      if (q.length > 0) {
        const now = new Date();
        const current = q.find(
          (quarter: TaxQuarter) =>
            new Date(quarter.startDate) <= now && new Date(quarter.endDate) >= now
        );
        setSelectedQuarter(current || q[0]);
      }
    } catch (err) {
      console.error('Failed to load quarters:', err);
    }
  }, []);

  useEffect(() => {
    loadQuarters();
  }, [loadQuarters]);

  useEffect(() => {
    if (!selectedQuarter) return;
    const loadTaxData = async () => {
      setIsLoading(true);
      try {
        const data = await window.ipcRenderer.invoke('tax:calculate-period', {
          startDate: selectedQuarter.startDate,
          endDate: selectedQuarter.endDate,
        });
        setTaxData(data);
      } catch (err) {
        console.error('Failed to calculate tax:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTaxData();
  }, [selectedQuarter]);

  const handleExport = useCallback(async () => {
    if (!selectedQuarter || !taxData) return;
    try {
      const exportData: MTDExportJson = await window.ipcRenderer.invoke(
        'tax:export-mtd',
        {
          startDate: selectedQuarter.startDate,
          endDate: selectedQuarter.endDate,
        }
      );
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mtd-export-${selectedQuarter.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  }, [selectedQuarter, taxData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
      amount
    );

  const incomeBoxes = useMemo(() => {
    if (!taxData) return [];
    return Object.entries(taxData.boxes)
      .filter(([, box]) => box.type === 'income')
      .sort(([a], [b]) => Number(a) - Number(b));
  }, [taxData]);

  const expenseBoxes = useMemo(() => {
    if (!taxData) return [];
    return Object.entries(taxData.boxes)
      .filter(([, box]) => box.type === 'expense')
      .sort(([a], [b]) => Number(a) - Number(b));
  }, [taxData]);

  const daysUntilDeadline = useMemo(() => {
    if (!selectedQuarter) return 0;
    const deadline = new Date(selectedQuarter.deadline);
    const now = new Date();
    return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }, [selectedQuarter]);

  if (isLoading && !taxData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-8 py-8 space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="inline-flex p-1 bg-surface-container-low rounded-xl">
          {quarters.length > 0 &&
            (() => {
              const years = [...new Set(quarters.map((q) => q.name.split(' ')[0]))];
              return years.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    const q = quarters.find((q) => q.name.startsWith(year));
                    if (q) setSelectedQuarter(q);
                  }}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                    (!selectedYear && quarters[0]?.name.startsWith(year)) ||
                    selectedYear === year
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {year}
                </button>
              ));
            })()}
        </div>
        <button onClick={handleExport} className="btn btn-primary">
          <Download className="w-5 h-5" strokeWidth={1.5} />
          Export MTD JSON
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-surface-container-lowest p-8 min-h-[320px] flex flex-col justify-between group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">
                {selectedQuarter?.name || 'Annual'} Performance
              </span>
              <h3 className="text-4xl font-extrabold font-headline tracking-tight">
                Net Profit
              </h3>
            </div>
            {taxData && taxData.summary.netProfit > 0 && (
              <div className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Profitable
              </div>
            )}
          </div>
          <div className="relative z-10">
            <p className="text-6xl font-black font-headline text-on-surface tracking-tighter">
              {taxData ? formatCurrency(taxData.summary.netProfit) : '—'}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-8 border-t border-outline-variant/10 pt-8">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-on-surface-variant opacity-60 uppercase tracking-widest">
                  Total Income
                </p>
                <p className="text-xl font-bold font-headline text-on-surface">
                  {taxData ? formatCurrency(taxData.summary.totalIncome) : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-on-surface-variant opacity-60 uppercase tracking-widest">
                  Total Expenses
                </p>
                <p className="text-xl font-bold font-headline text-error">
                  {taxData ? formatCurrency(taxData.summary.totalExpenses) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-inverse-surface p-8 text-on-primary flex flex-col justify-between">
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/20 to-transparent" />
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-fixed mb-2 block">
              Next Submission
            </span>
            <h3 className="text-2xl font-extrabold font-headline text-white leading-tight">
              {selectedQuarter?.name || 'Q4'} MTD Filing
            </h3>
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black font-headline text-white">
                {daysUntilDeadline}
              </span>
              <span className="text-lg font-bold text-white/60 mb-1">days left</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              All expenses must be categorized before your MTD submission deadline.
            </p>
            <button
              onClick={handleExport}
              className="w-full py-3 bg-white text-inverse-surface rounded-xl font-bold text-sm hover:bg-surface-container transition-colors"
            >
              Prepare Submission
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold font-headline">Quarterly Breakdown</h4>
          <span className="text-xs font-medium text-on-surface-variant">
            HM Revenue &amp; Customs Compliant
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quarters.map((quarter) => {
            const isSelected = selectedQuarter?.id === quarter.id;
            const isPast = new Date(quarter.endDate) < new Date();
            return (
              <div
                key={quarter.id}
                onClick={() => setSelectedQuarter(quarter)}
                className={`rounded-2xl p-6 transition-all cursor-pointer ${
                  isPast
                    ? 'glass-card border border-white/40 shadow-sm hover:translate-y-[-4px] hover:shadow-lg'
                    : 'border-2 border-dashed border-outline-variant/30 bg-surface-container-low/30 hover:border-primary/40'
                } ${isSelected ? 'ring-2 ring-primary/30' : ''}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <span className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant font-black font-headline text-sm">
                    {quarter.name.split(' ').pop()}
                  </span>
                  {isPast ? (
                    <CheckCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  ) : (
                    <Clock className="w-5 h-5 text-outline" strokeWidth={1.5} />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant opacity-50 mb-1">
                      {isPast ? 'Period' : 'Upcoming'}
                    </p>
                    <p className="text-sm font-bold font-headline text-on-surface">
                      {quarter.name}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {taxData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4">
          <div className="space-y-6">
            <h4 className="text-lg font-bold font-headline">Income Breakdown</h4>
            <div className="space-y-3">
              {incomeBoxes.map(([boxNum, box]) => (
                <div
                  key={boxNum}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low"
                >
                  <span className="text-sm font-semibold">
                    Box {boxNum}: {box.name}
                  </span>
                  <span className="text-sm font-bold">
                    {formatCurrency(box.amount)}
                  </span>
                </div>
              ))}
              {incomeBoxes.length === 0 && (
                <p className="text-sm text-on-surface-variant p-4">No income recorded</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-bold font-headline">Expense Breakdown</h4>
            <div className="space-y-3">
              {expenseBoxes.map(([boxNum, box]) => (
                <div
                  key={boxNum}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low"
                >
                  <span className="text-sm font-semibold">
                    Box {boxNum}: {box.name}
                  </span>
                  <span className="text-sm font-bold">
                    {formatCurrency(box.amount)}
                  </span>
                </div>
              ))}
              {expenseBoxes.length === 0 && (
                <p className="text-sm text-on-surface-variant p-4">No expenses recorded</p>
              )}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary-container text-on-primary-container">
                <span className="font-bold">Net Profit</span>
                <span className="text-lg font-black font-headline">
                  {formatCurrency(taxData.summary.netProfit)}
                </span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant/70 italic">
              *Based on {taxData.transactionCount} categorized transactions in this
              period.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}