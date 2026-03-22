import { useState, useEffect } from 'react';
import { X, Calendar, RefreshCw, Info } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (dateFrom: string, dateTo: string) => void;
}

function getTaxYearBoundaries() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const taxYearStart =
    currentMonth < 3 || (currentMonth === 3 && today.getDate() < 6)
      ? `${currentYear - 1}-04-06`
      : `${currentYear}-04-06`;
  const taxYearEnd =
    currentMonth < 3 || (currentMonth === 3 && today.getDate() < 6)
      ? `${currentYear}-04-05`
      : `${currentYear + 1}-04-05`;
  return { taxYearStart, taxYearEnd };
}

function getDatePresets() {
  const today = new Date();
  const { taxYearStart, taxYearEnd } = getTaxYearBoundaries();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return [
    { label: 'Last 30 days', from: thirtyDaysAgo.toISOString().split('T')[0], to: today.toISOString().split('T')[0] },
    { label: 'Last 90 days', from: ninetyDaysAgo.toISOString().split('T')[0], to: today.toISOString().split('T')[0] },
    { label: 'This month', from: monthStart.toISOString().split('T')[0], to: today.toISOString().split('T')[0] },
    { label: 'Last month', from: lastMonthStart.toISOString().split('T')[0], to: lastMonthEnd.toISOString().split('T')[0] },
    { label: 'This tax year', from: taxYearStart, to: today.toISOString().split('T')[0] },
    { label: 'Full tax year', from: taxYearStart, to: taxYearEnd },
  ];
}

export default function SyncModal({ isOpen, onClose, onSync }: SyncModalProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const presets = getDatePresets();

  useEffect(() => {
    if (isOpen) {
      const preset = presets[1];
      setDateFrom(preset.from);
      setDateTo(preset.to);
    }
  }, [isOpen]);

  const handleSync = async () => {
    if (!dateFrom || !dateTo) return;
    setIsSyncing(true);
    try {
      await onSync(dateFrom, dateTo);
      onClose();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const applyPreset = (preset: (typeof presets)[0]) => {
    setDateFrom(preset.from);
    setDateTo(preset.to);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden editorial-shadow">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-lg font-bold text-on-surface font-headline">
              Sync Transactions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-container rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-2 p-4 bg-primary-container/20 rounded-xl text-sm text-on-surface">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" strokeWidth={1.5} />
            <p className="text-on-surface-variant">
              Select a date range to fetch transactions from your connected banks.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    dateFrom === preset.from && dateTo === preset.to
                      ? 'bg-primary-container text-on-primary-container font-bold'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" strokeWidth={1.5} />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" strokeWidth={1.5} />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-surface-container-low flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={!dateFrom || !dateTo || isSyncing}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            {isSyncing ? 'Syncing...' : 'Start Sync'}
          </button>
        </div>
      </div>
    </div>
  );
}