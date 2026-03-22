import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  password_hash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  mtdBox: integer('mtd_box'), // MTD box number for tax reporting
  sortOrder: integer('sort_order').default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
});

// Learning rules for auto-categorization based on user behavior
export const learningRules = sqliteTable('learning_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  merchantPattern: text('merchant_pattern').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  useCount: integer('use_count').default(1),
  lastUsed: integer('last_used', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const bankConnections = sqliteTable('bank_connections', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(), // e.g., 'gocardless'
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'expired' | 'error'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  bankConnectionId: text('bank_connection_id').references(() => bankConnections.id),
  accountId: text('account_id'),
  currency: text('currency').default('GBP').notNull(),
  merchant: text('merchant'),
  metadata: text('metadata'), // JSON stringified
  status: text('status').notNull().default('pending'), // 'pending' | 'cleared'
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON stringified
});

export const categorizationRules = sqliteTable('categorization_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  conditions: text('conditions').notNull(), // JSON string: { field: 'description', operator: 'contains', value: 'Starbucks' }
  action: text('action').notNull(), // JSON string: { categoryId: 1 }
  priority: integer('priority').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const taxPeriods = sqliteTable('tax_periods', {
  id: text('id').primaryKey(), // e.g., '2024-Q1'
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('open'), // 'open' | 'closed' | 'submitted'
});

export const vatReturns = sqliteTable('vat_returns', {
  id: text('id').primaryKey(),
  periodId: text('period_id').references(() => taxPeriods.id).notNull(),
  jsonData: text('json_data').notNull(), // The generated MTD JSON payload
  submissionId: text('submission_id'), // HMRC submission ID (future proofing)
  status: text('status').notNull().default('draft'), // 'draft' | 'submitted'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});