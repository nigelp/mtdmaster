import { useState, useEffect } from 'react';
import {
  Info,
  ChevronRight,
  Sparkles,
  Plus,
} from 'lucide-react';
import type { Category } from '../types';
import { useNavigate } from 'react-router-dom';

interface LearningRule {
  merchantPattern: string;
  suggestedCategory: string;
  useCount: number;
  confidence: 'high' | 'medium' | 'low';
}

interface CategoryStats {
  id: number;
  transactionCount: number;
  totalAmount: number;
}

const mtdBoxLabels: Record<number, string> = {
  6: 'Box 6 · Turnover',
  17: 'Box 17 · Cost of Goods',
  20: 'Box 20 · Admin',
  24: 'Box 24 · Travel',
  25: 'Box 25 · Advertising',
  26: 'Box 26 · Professional Fees',
  27: 'Box 27 · Insurance',
  28: 'Box 28 · Bank Charges',
  29: 'Box 29 · Utilities',
  30: 'Box 30 · Other Expenses',
};

function getCategoryBadgeStyle(type: string) {
  switch (type) {
    case 'income':
      return 'text-primary bg-primary-container/30';
    case 'expense':
      return 'text-error bg-error-container/10';
    default:
      return 'text-secondary bg-secondary-container/30';
  }
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [learningRules, setLearningRules] = useState<LearningRule[]>([]);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'learning'>('categories');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cats, txns] = await Promise.all([
          window.ipcRenderer.invoke('categories:getAll'),
          window.ipcRenderer.invoke('transactions:getWithCategories'),
        ]);
        setCategories(cats);

        const categoryStats: Record<number, CategoryStats> = {};
        const merchantPatterns: Record<string, { category: string; count: number }> = {};

        txns.forEach((t: any) => {
          if (t.categoryId) {
            if (!categoryStats[t.categoryId]) {
              categoryStats[t.categoryId] = {
                id: t.categoryId,
                transactionCount: 0,
                totalAmount: 0,
              };
            }
            categoryStats[t.categoryId].transactionCount++;
            categoryStats[t.categoryId].totalAmount += Math.abs(t.amount);
          }
          if (t.merchant && t.category) {
            const key = t.merchant.toLowerCase();
            if (!merchantPatterns[key]) {
              merchantPatterns[key] = { category: t.category.name, count: 0 };
            }
            merchantPatterns[key].count++;
          }
        });

        setStats(Object.values(categoryStats));
        setLearningRules(
          Object.entries(merchantPatterns)
            .filter(([, v]) => v.count >= 2)
            .map(([merchant, v]): LearningRule => ({
              merchantPattern: merchant,
              suggestedCategory: v.category,
              useCount: v.count,
              confidence: v.count >= 5 ? 'high' : v.count >= 3 ? 'medium' : 'low',
            }))
            .sort((a, b) => b.useCount - a.useCount)
        );
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getCategoryStats = (catId: number) =>
    stats.find((s) => s.id === catId) || { transactionCount: 0, totalAmount: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-10 py-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
          Categories
        </h1>
        <p className="text-on-surface-variant font-medium">
          MTD-compliant expense categories and learning rules
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container p-1 rounded-xl flex gap-1 w-fit mb-6">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('learning')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'learning'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              Learning Rules ({learningRules.length})
            </button>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/40 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center">
                <Info className="w-5 h-5 text-on-tertiary-container" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-bold text-on-surface">MTD Category Mapping</h3>
                <p className="text-sm text-on-surface-variant">
                  Your transactions are automatically mapped to HMRC's Making Tax Digital
                  categories.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 relative overflow-hidden rounded-3xl bg-primary min-h-[180px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dim opacity-90" />
          <div className="relative z-10 p-8 h-full flex flex-col justify-end">
            <p className="text-white/80 text-xs font-bold tracking-widest uppercase mb-1">
              Tax Strategy
            </p>
            <h4 className="text-white text-xl font-bold leading-tight">
              Optimise your
              <br />
              2024/25 expenses
            </h4>
          </div>
        </div>
      </div>

      {activeTab === 'categories' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const catStats = getCategoryStats(cat.id);
              return (
                <div
                  key={cat.id}
                  className="glass-card p-6 rounded-2xl border border-white/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center mb-4 text-lg">
                    {cat.icon}
                  </div>
                  <h4 className="font-bold text-on-surface mb-1">{cat.name}</h4>
                  <p className="text-xs text-on-surface-variant mb-4">
                    {cat.mtdBox ? mtdBoxLabels[cat.mtdBox] || `Box ${cat.mtdBox}` : cat.type}
                    {catStats.transactionCount > 0 && (
                      <span className="ml-1">
                        · {catStats.transactionCount} txns · £
                        {catStats.totalAmount.toFixed(0)}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getCategoryBadgeStyle(
                        cat.type
                      )}`}
                    >
                      {cat.type}
                    </span>
                    <ChevronRight className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                </div>
              );
            })}

            <div className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-surface-container transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full border border-outline-variant/50 flex items-center justify-center mb-4 group-hover:bg-surface-container-lowest transition-colors">
                <Plus className="w-5 h-5 text-outline" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold text-on-surface-variant">Add Custom Category</p>
            </div>
          </div>
        </>
      ) : learningRules.length > 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">
                  Merchant Pattern
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">
                  Suggested Category
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">
                  Uses
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {learningRules.map((rule, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/20 transition-colors">
                  <td className="px-8 py-5 text-sm font-semibold text-on-background">
                    {rule.merchantPattern}
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                      {rule.suggestedCategory}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-on-surface-variant">
                    {rule.useCount} times
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        rule.confidence === 'high'
                          ? 'bg-primary/10 text-primary'
                          : rule.confidence === 'medium'
                          ? 'bg-tertiary-container/30 text-tertiary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {rule.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-16 p-12 bg-surface-container-low rounded-[40px] text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-3 font-headline">
            No Learning Rules Yet
          </h3>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            Assign categories to your transactions and we'll start learning your patterns
            to automate your bookkeeping.
          </p>
          <button
            onClick={() => navigate('/transactions')}
            className="btn btn-primary"
          >
            View Recent Transactions
          </button>
        </div>
      )}
    </div>
  );
}