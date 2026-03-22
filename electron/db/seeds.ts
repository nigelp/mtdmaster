import { eq, count } from 'drizzle-orm';
import { categories, learningRules } from './schema';

// MTD-aligned default categories
// Box 6: Turnover (income)
// Box 17-30: Various allowable expenses
export const DEFAULT_CATEGORIES = [
  // Income (Box 6)
  { name: 'Sales Revenue', type: 'income', mtdBox: 6, color: '#10b981', icon: '💰', sortOrder: 1 },
  { name: 'Professional Income', type: 'income', mtdBox: 6, color: '#3b82f6', icon: '💼', sortOrder: 2 },
  { name: 'Revenue - Writing', type: 'income', mtdBox: 6, color: '#059669', icon: '✍️', sortOrder: 3 },
  { name: 'Revenue - Misc', type: 'income', mtdBox: 6, color: '#0d9488', icon: '📝', sortOrder: 4 },
  { name: 'Pension', type: 'income', mtdBox: 6, color: '#7c3aed', icon: '🏛️', sortOrder: 5 },
  
  // Expenses (Box 17-30)
  { name: 'Purchases/Stock', type: 'expense', mtdBox: 17, color: '#ef4444', icon: '📦', sortOrder: 10 },
  { name: 'Office Costs', type: 'expense', mtdBox: 20, color: '#f59e0b', icon: '🏢', sortOrder: 11 },
  { name: 'Rent', type: 'expense', mtdBox: 20, color: '#d97706', icon: '🏠', sortOrder: 12 },
  { name: 'Vehicle Expenses', type: 'expense', mtdBox: 24, color: '#8b5cf6', icon: '🚗', sortOrder: 13 },
  { name: 'Travel', type: 'expense', mtdBox: 24, color: '#06b6d4', icon: '✈️', sortOrder: 14 },
  { name: 'Marketing', type: 'expense', mtdBox: 25, color: '#ec4899', icon: '📱', sortOrder: 15 },
  { name: 'Professional Fees', type: 'expense', mtdBox: 26, color: '#6366f1', icon: '👔', sortOrder: 16 },
  { name: 'Accountancy', type: 'expense', mtdBox: 26, color: '#4f46e5', icon: '📊', sortOrder: 17 },
  { name: 'Insurance', type: 'expense', mtdBox: 27, color: '#14b8a6', icon: '🛡️', sortOrder: 18 },
  { name: 'Bank Charges', type: 'expense', mtdBox: 28, color: '#64748b', icon: '🏦', sortOrder: 19 },
  { name: 'Credit Card', type: 'expense', mtdBox: 28, color: '#475569', icon: '💳', sortOrder: 20 },
  { name: 'Utilities', type: 'expense', mtdBox: 29, color: '#eab308', icon: '💡', sortOrder: 21 },
  { name: 'Software & Subscriptions', type: 'expense', mtdBox: 20, color: '#0ea5e9', icon: '💻', sortOrder: 22 },
  { name: 'Other Expenses', type: 'expense', mtdBox: 30, color: '#9ca3af', icon: '📋', sortOrder: 23 },
  
  // Non-business (excluded from tax)
  { name: 'Personal', type: 'expense', mtdBox: null, color: '#6b7280', icon: '👤', sortOrder: 30 },
] as const;

export type CategorySeed = typeof DEFAULT_CATEGORIES[number];

export async function seedDefaultCategories(db: any): Promise<{ seeded: boolean; count: number; added: number }> {
  // Get existing categories
  const existing = await db.select().from(categories);
  const existingNames = new Set(existing.map((c: any) => c.name));
  
  // Find missing categories
  const missing = DEFAULT_CATEGORIES.filter(cat => !existingNames.has(cat.name));
  
  if (missing.length === 0) {
    return { seeded: false, count: existing.length, added: 0 };
  }
  
  // Insert missing categories
  await db.insert(categories).values(
    missing.map(cat => ({
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      mtdBox: cat.mtdBox,
      sortOrder: cat.sortOrder,
      isDefault: true,
    }))
  );
  
  return { seeded: true, count: existing.length + missing.length, added: missing.length };
}