// Category type matching database schema
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  mtdBox?: number;
  sortOrder?: number;
  isDefault?: boolean;
}

// Transaction type matching database schema
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date | string;
  categoryId: number | null;
  bankConnectionId: string | null;
  accountId: string | null;
  currency: string;
  merchant: string | null;
  metadata: string | null;
  status: 'pending' | 'cleared';
}

// Enhanced transaction with category info and confidence
export interface TransactionWithCategory extends Transaction {
  category: Category | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  suggestedCategoryId: number | null;
}

// Tax calculation result
export interface TaxCalculationResult {
  period: {
    start: string;
    end: string;
  };
  boxes: Record<number, {
    name: string;
    amount: number;
    type: string;
  }>;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  };
  transactionCount: number;
}

// UK Tax Quarter
export interface TaxQuarter {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  deadline: string;
}

// MTD Export JSON structure
export interface MTDExportJson {
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  selfEmployment: {
    turnover: number;
    allowableExpenses: {
      costOfGoods: number;
      adminCosts: number;
      travel: number;
      advertising: number;
      professionalFees: number;
      insurance: number;
      bankCharges: number;
      utilities: number;
      otherExpenses: number;
      totalExpenses: number;
    };
    netProfit: number;
  };
}