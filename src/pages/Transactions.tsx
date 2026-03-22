import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
  type PaginationState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ArrowUpDown,
  RefreshCw,
  Landmark,
  Share,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Computer,
  ShoppingBag,
  Train,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import LinkBankModal from '../components/LinkBankModal';
import SyncModal from '../components/SyncModal';
import CategoryDropdown from '../components/CategoryDropdown';
import type { Category, TransactionWithCategory } from '../types';

interface DisplayTransaction extends TransactionWithCategory {
  categoryId: number | null;
}

function getCategoryIcon(description: string) {
  const lower = description.toLowerCase();
  if (lower.includes('adobe') || lower.includes('software') || lower.includes('cloud'))
    return Computer;
  if (lower.includes('store') || lower.includes('shop') || lower.includes('amazon'))
    return ShoppingBag;
  if (lower.includes('tfl') || lower.includes('train') || lower.includes('travel'))
    return Train;
  return CreditCard;
}

export default function Transactions() {
  const [data, setData] = useState<DisplayTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [autoCatResult, setAutoCatResult] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'demo' | 'bank'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'categorized' | 'uncategorized'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const DEMO_ACCOUNT_ID = 'demo-account-001';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txns, cats] = await Promise.all([
        window.ipcRenderer.invoke('transactions:getWithCategories'),
        window.ipcRenderer.invoke('categories:getAll'),
      ]);
      setData(
        txns.map((t: TransactionWithCategory) => ({
          ...t,
          categoryId: t.categoryId ?? t.category?.id ?? null,
        }))
      );
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const removeListener = window.ipcRenderer.on('transactions:updated', () => {
      loadData();
    });
    return () => removeListener();
  }, [loadData]);

  const handleCategorize = useCallback(
    async (transactionId: string, categoryId: number) => {
      try {
        await window.ipcRenderer.invoke('transactions:categorize', {
          transactionId,
          categoryId,
        });
        setData((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  categoryId,
                  category: categories.find((c) => c.id === categoryId) || t.category,
                  confidence: 'high' as const,
                }
              : t
          )
        );
      } catch (err) {
        console.error('Failed to categorize:', err);
      }
    },
    [categories]
  );

  const handleBulkCategorize = useCallback(
    async (categoryId: number) => {
      const selectedIds = Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map((key) => data[parseInt(key)]?.id)
        .filter(Boolean);
      if (selectedIds.length === 0) return;
      try {
        await window.ipcRenderer.invoke('transactions:bulk-categorize', {
          transactionIds: selectedIds,
          categoryId,
        });
        await loadData();
        setRowSelection({});
      } catch (err) {
        console.error('Failed to bulk categorize:', err);
      }
    },
    [rowSelection, data, loadData]
  );

  const handleAutoCategories = useCallback(async () => {
    setIsAutoCategorizing(true);
    setAutoCatResult(null);
    try {
      const result = await window.ipcRenderer.invoke('transactions:auto-categorize');
      await loadData();
      setAutoCatResult(result?.categorized ?? 0);
      if (result?.categorized > 0) {
        setTimeout(() => setAutoCatResult(null), 5000);
      }
    } catch (err) {
      console.error('Failed to auto-categorize:', err);
    } finally {
      setIsAutoCategorizing(false);
    }
  }, [loadData]);

  const handleSync = useCallback(
    async (dateFrom: string, dateTo: string) => {
      setIsSyncing(true);
      try {
        await window.ipcRenderer.invoke('transactions:sync', { dateFrom, dateTo });
        await loadData();
      } catch (err) {
        console.error('Sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [loadData]
  );

  const uncategorizedCount = useMemo(
    () => data.filter((t) => !t.categoryId).length,
    [data]
  );


  const filteredData = useMemo(() => {
    return data.filter((t) => {
      if (sourceFilter === 'demo' && t.accountId !== DEMO_ACCOUNT_ID) return false;
      if (sourceFilter === 'bank' && t.accountId === DEMO_ACCOUNT_ID) return false;
      if (statusFilter === 'categorized' && !t.categoryId) return false;
      if (statusFilter === 'uncategorized' && t.categoryId) return false;
      if (typeFilter === 'income' && t.amount <= 0) return false;
      if (typeFilter === 'expense' && t.amount > 0) return false;
      if (categoryFilter !== null && t.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [data, sourceFilter, statusFilter, typeFilter, categoryFilter]);

  const activeFilterCount = [
    sourceFilter !== 'all',
    statusFilter !== 'all',
    typeFilter !== 'all',
    categoryFilter !== null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSourceFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter(null);
  };

  const selectedCount = Object.keys(rowSelection).filter(
    (key) => rowSelection[key]
  ).length;

  const columnHelper = createColumnHelper<DisplayTransaction>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-outline-variant/30 text-primary focus:ring-primary/20"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-outline-variant/30 text-primary focus:ring-primary/20"
          />
        ),
        size: 40,
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) => {
          const date = new Date(info.getValue());
          return (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-on-background">
                {format(date, 'dd MMM')}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {format(date, 'yyyy')}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => {
          const Icon = getCategoryIcon(info.getValue());
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                <Icon className="w-4 h-4 text-on-surface-variant" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-sm font-semibold text-on-background">
                  {info.getValue()}
                </span>
                {info.row.original.merchant && (
                  <p className="text-[11px] text-on-surface-variant">
                    {info.row.original.merchant}
                  </p>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <CategoryDropdown
            categories={categories}
            selectedId={row.original.categoryId}
            suggestedId={row.original.suggestedCategoryId}
            confidence={row.original.confidence || 'none'}
            onSelect={(catId) => handleCategorize(row.original.id, catId)}
          />
        ),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => {
          const amount = info.getValue();
          const isPositive = amount > 0;
          return (
            <span
              className={`text-sm font-bold ${
                isPositive ? 'text-primary' : 'text-on-background'
              }`}
            >
              {isPositive ? '+' : ''}
              {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
              }).format(amount)}
            </span>
          );
        },
        meta: { align: 'right' },
      }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { categoryId, confidence, suggestedCategoryId } = row.original;
          if (categoryId && confidence === 'high') {
            return (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-4 h-4" strokeWidth={2} />
                <span className="text-xs font-semibold">Confirmed</span>
              </div>
            );
          }
          if (categoryId) {
            return (
              <div className="flex items-center gap-2 text-tertiary">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed" />
                <span className="text-xs font-semibold">Matched</span>
              </div>
            );
          }
          if (suggestedCategoryId) {
            return (
              <div className="flex items-center gap-2 text-tertiary">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed" />
                <span className="text-xs font-semibold">Review Rule</span>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-2 text-error">
              <span className="w-2 h-2 rounded-full bg-error" />
              <span className="text-xs font-semibold">Uncategorized</span>
            </div>
          );
        },
      }),
    ],
    [categories, handleCategorize, columnHelper]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, rowSelection, globalFilter: searchQuery, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setSearchQuery,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-background">
            Transactions
          </h2>
          <p className="text-on-surface-variant mt-2 text-lg">
            Manage and categorize your expenses for the current tax year.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="btn btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            Sync Now
          </button>
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="btn btn-primary"
          >
            <Landmark className="w-4 h-4" strokeWidth={1.5} />
            Link Bank
          </button>
        </div>
      </div>

      {uncategorizedCount > 0 && (
        <div className="glass-card bg-surface-container-low rounded-2xl p-6 flex items-center justify-between border-l-4 border-primary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="font-bold text-on-background">
                {uncategorizedCount} uncategorized
              </h4>
              <p className="text-sm text-on-surface-variant">
                Complete your categorization to get an accurate tax estimate.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoCategories}
              disabled={isAutoCategorizing}
              className="btn btn-primary text-sm"
            >
              <Sparkles className={`w-4 h-4 ${isAutoCategorizing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              {isAutoCategorizing ? 'Categorizing...' : 'Auto-Categorize'}
            </button>
          </div>
        </div>
      )}

      {autoCatResult !== null && (
        <div className="glass-card bg-primary/5 rounded-2xl p-4 flex items-center justify-between border-l-4 border-primary animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary" strokeWidth={2} />
            <span className="text-sm font-bold text-on-background">
              {autoCatResult > 0
                ? `${autoCatResult} transaction${autoCatResult > 1 ? 's' : ''} auto-categorized`
                : 'No matching uncategorized transactions found'}
            </span>
          </div>
          <button
            onClick={() => setAutoCatResult(null)}
            className="text-xs text-on-surface-variant hover:text-on-background"
          >
            Dismiss
          </button>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="bg-surface-container-low rounded-2xl px-6 py-4 flex items-center gap-4">
          <span className="text-sm font-medium text-on-surface-variant">
            {selectedCount} selected
          </span>
          <div className="relative">
            <button
              onClick={() => setShowBulkDropdown(!showBulkDropdown)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-on-primary flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Categorize as...
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showBulkDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/10 py-1 z-50 min-w-[220px] max-h-72 overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { handleBulkCategorize(cat.id); setShowBulkDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setRowSelection({}); setShowBulkDropdown(false); }}
            className="ml-auto text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Deselect all
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="px-4 py-2.5 rounded-xl text-sm bg-surface-container-lowest border border-outline-variant/15 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 w-56 outline-none transition-colors"
        />

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
          className="px-3 py-2.5 rounded-xl text-sm bg-surface-container-lowest border border-outline-variant/15 text-on-surface outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
        >
          <option value="all">All Sources</option>
          <option value="bank">Bank Only</option>
          <option value="demo">Demo Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2.5 rounded-xl text-sm bg-surface-container-lowest border border-outline-variant/15 text-on-surface outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="categorized">Categorized</option>
          <option value="uncategorized">Uncategorized</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-3 py-2.5 rounded-xl text-sm bg-surface-container-lowest border border-outline-variant/15 text-on-surface outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>

        <select
          value={categoryFilter ?? ''}
          onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2.5 rounded-xl text-sm bg-surface-container-lowest border border-outline-variant/15 text-on-surface outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="text-xs text-on-surface-variant">
              {filteredData.length} of {data.length}
            </span>
          )}
          <button className="px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors flex items-center gap-2">
            <Share className="w-4 h-4" strokeWidth={1.5} />
            Export
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-surface-container-low/30">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant ${
                          (header.column.columnDef.meta as any)?.align === 'right'
                            ? 'text-right'
                            : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                      >
                        <div className="flex items-center gap-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-8 py-20 text-center text-on-surface-variant">
                      No transactions found. Link a bank account or sync to import transactions.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-container-low/20 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`px-8 py-5 ${
                            (cell.column.columnDef.meta as any)?.align === 'right'
                              ? 'text-right'
                              : ''
                          }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {table.getFilteredRowModel().rows.length > 0 && (
              <div className="px-8 py-5 border-t border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant">Rows per page</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') {
                        setPagination({ pageIndex: 0, pageSize: filteredData.length || 9999 });
                      } else {
                        setPagination({ pageIndex: 0, pageSize: Number(val) });
                      }
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs bg-surface-container-lowest border border-outline-variant/15 text-on-surface outline-none focus:border-primary/40 transition-colors cursor-pointer"
                  >
                    {[25, 50, 100].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                    <option value="all">All</option>
                  </select>
                </div>

                <span className="text-xs text-on-surface-variant">
                  {pagination.pageIndex * pagination.pageSize + 1}–{Math.min(
                    (pagination.pageIndex + 1) * pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )} of {table.getFilteredRowModel().rows.length}
                  {activeFilterCount > 0 && ` (${data.length} total)`}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs text-on-surface-variant">
                    Page {pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard className="w-16 h-16" strokeWidth={0.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Total Transactions
          </span>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-extrabold font-headline">{data.length}</span>
            <span className="text-xs text-on-surface-variant mt-1 font-medium">
              Imported this period
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-16 h-16" strokeWidth={0.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Uncategorized
          </span>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-extrabold font-headline text-error">
              {uncategorizedCount}
            </span>
            <span className="text-xs text-on-surface-variant mt-1 font-medium">
              Need your attention
            </span>
          </div>
        </div>
        <div className="bg-primary rounded-3xl p-6 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-16 h-16" strokeWidth={0.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
            Categorized
          </span>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-extrabold font-headline">
              {data.length - uncategorizedCount}
            </span>
            <span className="text-xs text-white/70 mt-1 font-medium">
              Ready for tax filing
            </span>
          </div>
        </div>
      </div>

      <LinkBankModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
      />
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSync={handleSync}
      />
    </div>
  );
}