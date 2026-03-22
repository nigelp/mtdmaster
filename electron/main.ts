import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { initDB, getDB, closeDB } from './db';
import { users, transactions, categories, settings, bankConnections, learningRules } from './db/schema';
import { eq, desc, and, gte, lte, isNotNull, isNull, sql } from 'drizzle-orm';
import { GoCardlessService } from './services/gocardless.service';
import { SyncService } from './services/sync.service';
import { seedDefaultCategories } from './db/seeds';
import { generateDemoTransactions, DEMO_ACCOUNT_ID } from './db/demo-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT!, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT!, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT!, 'public')
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC || path.join(process.env.APP_ROOT!, 'public'), 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // Required for better-sqlite3
    },
    frame: true,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    show: false // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    console.log('Loading from dev server:', VITE_DEV_SERVER_URL);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open devtools in development
    // mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading from file:', path.join(RENDERER_DIST, 'index.html'));
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    closeDB();
  });

  // Handle load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Focus existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Handle protocol URL callback
      const url = commandLine.pop();
      if (url?.startsWith('mtd-master://')) {
        mainWindow.webContents.send('gocardless:callback', url);
      }
    }
  });
}

// App lifecycle
app.whenReady().then(async () => {
  initDB();
  
  // Seed default categories if not present
  const db = getDB();
  const seedResult = await seedDefaultCategories(db);
  if (seedResult.seeded) {
    console.log(`Seeded ${seedResult.count} default categories`);
  }

  // Register protocol
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('mtd-master', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('mtd-master');
  }

  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- Services ---
const gcService = new GoCardlessService({
  secretId: '', // Will be updated from settings
  secretKey: ''
});
const syncService = new SyncService(gcService);

const loadSecrets = () => {
  try {
    const db = getDB();
    const secretId = db.select().from(settings).where(eq(settings.key, 'gc_secret_id')).get();
    const secretKey = db.select().from(settings).where(eq(settings.key, 'gc_secret_key')).get();

    if (secretId && secretKey) {
      (gcService as any).config = {
        secretId: JSON.parse(secretId.value),
        secretKey: JSON.parse(secretKey.value)
      };
    }
  } catch (e) {
    console.error('Failed to load secrets:', e);
  }
};

// Normalize a description for pattern matching by stripping variable parts (numbers, amounts)
function normalizePattern(text: string): string {
  return text
    .replace(/[0-9.]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// --- IPC Handlers ---

// DB: Initialize
ipcMain.handle('db:initialize', async () => {
  return true;
});

// Transactions
ipcMain.handle('transactions:getAll', async () => {
  const db = getDB();
  return db.select().from(transactions).orderBy(desc(transactions.date)).all();
});

ipcMain.handle('transactions:getById', async (_, id) => {
  const db = getDB();
  return db.select().from(transactions).where(eq(transactions.id, id)).get();
});

ipcMain.handle('transactions:update', async (_, id, data) => {
  const db = getDB();
  db.update(transactions).set(data).where(eq(transactions.id, id)).run();
  return true;
});

ipcMain.handle('transactions:categorize', async (_, { transactionId, categoryId }: { transactionId: string; categoryId: number }) => {
  const id = transactionId;
  const db = getDB();
  
  const tx = db.select().from(transactions).where(eq(transactions.id, id)).get();
  
  db.update(transactions).set({ categoryId }).where(eq(transactions.id, id)).run();
  
  // Learn from this categorization using merchant or normalized description as pattern
  const pattern = tx?.merchant || (tx?.description ? normalizePattern(tx.description) : null);
  if (pattern) {
    const existingRule = db.select()
      .from(learningRules)
      .where(eq(learningRules.merchantPattern, pattern))
      .get();
    
    if (existingRule) {
      db.update(learningRules)
        .set({
          categoryId,
          useCount: (existingRule.useCount ?? 0) + 1,
          lastUsed: new Date()
        })
        .where(eq(learningRules.id, existingRule.id))
        .run();
    } else {
      db.insert(learningRules).values({
        merchantPattern: pattern,
        categoryId,
        useCount: 1,
        lastUsed: new Date(),
        createdAt: new Date()
      }).run();
    }

    // Auto-categorize all other uncategorized transactions matching this pattern
    const allUncategorized = db.select()
      .from(transactions)
      .where(isNull(transactions.categoryId))
      .all();
    
    for (const utx of allUncategorized) {
      const utxPattern = utx.merchant || normalizePattern(utx.description);
      if (utxPattern === pattern) {
        db.update(transactions)
          .set({ categoryId })
          .where(eq(transactions.id, utx.id))
          .run();
      }
    }
  }

  mainWindow?.webContents.send('transactions:updated');
  
  return true;
});

// Bulk categorize transactions
ipcMain.handle('transactions:bulk-categorize', async (_, { transactionIds, categoryId }: { transactionIds: string[]; categoryId: number }) => {
  const ids = transactionIds;
  const db = getDB();
  
  for (const id of ids) {
    db.update(transactions).set({ categoryId }).where(eq(transactions.id, id)).run();
  }
  
  // Notify renderer of update
  mainWindow?.webContents.send('transactions:updated');
  
  return { updated: ids.length };
});

// Get all transactions with category info for UI display
ipcMain.handle('transactions:getWithCategories', async () => {
  const db = getDB();
  
  const txs = db.select().from(transactions).orderBy(desc(transactions.date)).all();
  const cats = db.select().from(categories).all();
  const rules = db.select().from(learningRules).all();
  
  // Build category lookup
  const categoryMap = new Map(cats.map(c => [c.id, c]));
  
  // Build rule lookup by pattern (merchant or description)
  const ruleMap = new Map(rules.map(r => [r.merchantPattern, r]));
  
  // Enhance transactions with category info and confidence
  return txs.map(tx => {
    const category = tx.categoryId ? categoryMap.get(tx.categoryId) : null;
    const rule = (tx.merchant && ruleMap.get(tx.merchant)) || ruleMap.get(normalizePattern(tx.description)) || null;
    
    let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
    let suggestedCategoryId: number | null = null;
    
    if (tx.categoryId) {
      // Already categorized - determine confidence from rules
      confidence = rule && rule.useCount && rule.useCount >= 3 ? 'high' : 'medium';
    } else if (rule?.categoryId) {
      // Uncategorized but we have a rule suggestion
      suggestedCategoryId = rule.categoryId;
      confidence = rule.useCount && rule.useCount >= 3 ? 'high' : rule.useCount && rule.useCount >= 1 ? 'medium' : 'low';
    }
    
    return {
      ...tx,
      category,
      confidence,
      suggestedCategoryId
    };
  });
});

// Apply auto-categorization based on learned rules
ipcMain.handle('transactions:auto-categorize', async () => {
  const db = getDB();
  
  // Step 1: Backfill learning rules from already-categorized transactions
  const categorizedTxs = db.select()
    .from(transactions)
    .where(isNotNull(transactions.categoryId))
    .all();
  
  const existingRules = db.select().from(learningRules).all();
  const existingPatterns = new Set(existingRules.map(r => r.merchantPattern));
  
  for (const tx of categorizedTxs) {
    const pattern = tx.merchant || normalizePattern(tx.description);
    if (pattern && !existingPatterns.has(pattern) && tx.categoryId) {
      db.insert(learningRules).values({
        merchantPattern: pattern,
        categoryId: tx.categoryId,
        useCount: 1,
        lastUsed: new Date(),
        createdAt: new Date()
      }).run();
      existingPatterns.add(pattern);
    }
  }
  
  // Step 2: Reload rules after backfill and apply to uncategorized transactions
  const rules = db.select().from(learningRules).all();
  const ruleMap = new Map(rules.map(r => [r.merchantPattern, r]));
  
  const uncategorized = db.select()
    .from(transactions)
    .where(isNull(transactions.categoryId))
    .all();
  
  let categorized = 0;
  
  for (const tx of uncategorized) {
    const rule = (tx.merchant && ruleMap.get(tx.merchant)) || ruleMap.get(normalizePattern(tx.description));
    if (rule?.categoryId) {
      db.update(transactions)
        .set({ categoryId: rule.categoryId })
        .where(eq(transactions.id, tx.id))
        .run();
      categorized++;
    }
  }
  
  if (categorized > 0) {
    mainWindow?.webContents.send('transactions:updated');
  }
  
  return { categorized };
});

// Categories
ipcMain.handle('categories:getAll', async () => {
  const db = getDB();
  return db.select().from(categories).all();
});

ipcMain.handle('categories:create', async (_, data) => {
  const db = getDB();
  db.insert(categories).values(data).run();
  return true;
});

ipcMain.handle('categories:update', async (_, id, data) => {
  const db = getDB();
  db.update(categories).set(data).where(eq(categories.id, id)).run();
  return true;
});

ipcMain.handle('categories:delete', async (_, id) => {
  const db = getDB();
  db.delete(categories).where(eq(categories.id, id)).run();
  return true;
});

// Settings
ipcMain.handle('settings:get', async (_, key) => {
  const db = getDB();
  const result = db.select().from(settings).where(eq(settings.key, key)).get();
  return result ? JSON.parse(result.value) : null;
});

ipcMain.handle('settings:set', async (_, key, value) => {
  const db = getDB();
  const stringValue = JSON.stringify(value);
  db.insert(settings).values({ key, value: stringValue })
    .onConflictDoUpdate({ target: settings.key, set: { value: stringValue } })
    .run();
  return true;
});

ipcMain.handle('settings:getAll', async () => {
  const db = getDB();
  const allSettings = db.select().from(settings).all();
  return allSettings.reduce((acc, curr) => {
    acc[curr.key] = JSON.parse(curr.value);
    return acc;
  }, {} as Record<string, any>);
});

// GoCardless handlers
ipcMain.handle('gocardless:get-institutions', async (_, country = 'GB') => {
  try {
    loadSecrets();
    await gcService.getAccessToken();
    const institutions = await gcService.getBanks(country);
    return institutions;
  } catch (error: any) {
    console.error('Error fetching institutions:', error);
    throw new Error(`Failed to load banks: ${error.message}`);
  }
});

ipcMain.handle('gocardless:auth-url', async (_, institutionId: string) => {
  try {
    loadSecrets();
    await gcService.getAccessToken();
    
    // Create requisition with deep link redirect
    const requisition = await gcService.createRequisition(
      'mtd-master://callback',
      `ref-${Date.now()}`,
      institutionId
    );
    
    // Store requisition ID in pending state
    const db = getDB();
    db.insert(bankConnections).values({
      id: requisition.id,
      provider: 'gocardless',
      accessToken: '',
      refreshToken: '',
      expiresAt: new Date(Date.now() + (86400 * 1000)), // 24 hours
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }).run();
    
    return requisition.link;
  } catch (error: any) {
    console.error('Error creating auth URL:', error);
    throw new Error(`Failed to create auth link: ${error.message}`);
  }
});

ipcMain.handle('gocardless:complete-connection', async (_, callbackUrl: string) => {
  try {
    console.log('Completing connection with URL:', callbackUrl);
    
    // GoCardless callback format: mtd-master://callback/?ref=ref-123456
    // Find the most recent pending connection to complete
    const db = getDB();
    const pendingConnection = db.select()
      .from(bankConnections)
      .where(eq(bankConnections.status, 'pending'))
      .orderBy(desc(bankConnections.createdAt))
      .get();
    
    if (!pendingConnection) {
      throw new Error('No pending bank connection found. Please try linking again.');
    }
    
    const requisitionId = pendingConnection.id;
    console.log('Found pending requisition:', requisitionId);
    
    loadSecrets();
    await gcService.getAccessToken();
    
    // Get requisition to retrieve account IDs and verify it's complete
    const requisition = await gcService.getRequisition(requisitionId);
    console.log('Requisition status:', requisition.status);
    
    if (!requisition.accounts || requisition.accounts.length === 0) {
      throw new Error('No accounts found in requisition. Authentication may not be complete yet.');
    }
    
    // Update bank connection status
    db.update(bankConnections)
      .set({
        status: 'active',
        updatedAt: new Date()
      })
      .where(eq(bankConnections.id, requisitionId))
      .run();
    
    console.log(`Connection saved successfully with ${requisition.accounts.length} accounts`);
    
    // Send success event to renderer
    mainWindow?.webContents.send('gocardless:success', {
      requisitionId,
      accountCount: requisition.accounts.length
    });
    
    return {
      success: true,
      accountCount: requisition.accounts.length,
      requisitionId
    };
  } catch (error: any) {
    console.error('Error completing connection:', error);
    throw new Error(`Failed to complete connection: ${error.message}`);
  }
});

// Open banking credentials (provider TBD - placeholder saves to settings)
ipcMain.handle('gocardless:save-secrets', async (_, { secretId, secretKey }: { secretId: string; secretKey: string }) => {
  const db = getDB();
  const pairs = [
    { key: 'gc_secret_id', value: JSON.stringify(secretId) },
    { key: 'gc_secret_key', value: JSON.stringify(secretKey) },
  ];
  for (const { key, value } of pairs) {
    db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } }).run();
  }
  return true;
});

// Transactions sync handler
ipcMain.handle('transactions:sync', async (_, options?: { dateFrom?: string; dateTo?: string }) => {
  try {
    loadSecrets();
    await gcService.getAccessToken();
    
    // Get all active bank connections
    const db = getDB();
    const connections = db.select()
      .from(bankConnections)
      .where(eq(bankConnections.status, 'active'))
      .all();
    
    if (connections.length === 0) {
      return { synced: 0, message: 'No active bank connections found' };
    }
    
    let totalSynced = 0;
    
    // Sync each connection with optional date range
    for (const connection of connections) {
      const result = await syncService.syncConnection(
        connection.id,
        options?.dateFrom,
        options?.dateTo
      );
      totalSynced += result.synced;
    }
    
    // Auto-categorize newly synced transactions using learned rules
    let autoCategorized = 0;
    if (totalSynced > 0) {
      const rules = db.select().from(learningRules).all();
      const ruleMap = new Map(rules.map(r => [r.merchantPattern, r]));

      const uncategorized = db.select()
        .from(transactions)
        .where(and(
          isNotNull(transactions.merchant),
          isNull(transactions.categoryId)
        ))
        .all();

      for (const tx of uncategorized) {
        const rule = (tx.merchant && ruleMap.get(tx.merchant)) || ruleMap.get(normalizePattern(tx.description));
        if (rule?.categoryId) {
          db.update(transactions)
            .set({ categoryId: rule.categoryId })
            .where(eq(transactions.id, tx.id))
            .run();
          autoCategorized++;
        }
      }
    }

    return {
      synced: totalSynced,
      autoCategorized,
      connections: connections.length,
      dateRange: options?.dateFrom && options?.dateTo
        ? { from: options.dateFrom, to: options.dateTo }
        : undefined
    };
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    throw new Error(`Failed to sync transactions: ${error.message}`);
  }
});

// Tax calculation handlers
ipcMain.handle('tax:calculate-period', async (_, { startDate, endDate }: { startDate: string; endDate: string }) => {
  const db = getDB();
  
  // Get transactions in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const txs = db.select()
    .from(transactions)
    .where(and(
      gte(transactions.date, start),
      lte(transactions.date, end),
      isNotNull(transactions.categoryId)
    ))
    .all();
  
  // Get categories for MTD box mapping
  const cats = db.select().from(categories).all();
  const categoryMap = new Map(cats.map(c => [c.id, c]));
  
  // Aggregate by MTD box
  const boxTotals: Record<number, { name: string; amount: number; type: string }> = {};
  let totalIncome = 0;
  let totalExpenses = 0;
  
  for (const tx of txs) {
    const category = tx.categoryId ? categoryMap.get(tx.categoryId) : null;
    if (!category || !category.mtdBox) continue;
    
    const mtdBox = category.mtdBox;
    if (!boxTotals[mtdBox]) {
      boxTotals[mtdBox] = { name: category.name, amount: 0, type: category.type };
    }
    
    const amount = Math.abs(tx.amount);
    boxTotals[mtdBox].amount += amount;
    
    if (category.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }
  }
  
  return {
    period: { start: startDate, end: endDate },
    boxes: boxTotals,
    summary: {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    },
    transactionCount: txs.length
  };
});

// Export MTD JSON
ipcMain.handle('tax:export-mtd', async (_, { startDate, endDate }: { startDate: string; endDate: string }) => {
  const db = getDB();
  
  // Calculate period
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const txs = db.select()
    .from(transactions)
    .where(and(
      gte(transactions.date, start),
      lte(transactions.date, end),
      isNotNull(transactions.categoryId)
    ))
    .all();
  
  const cats = db.select().from(categories).all();
  const categoryMap = new Map(cats.map(c => [c.id, c]));
  
  // Build MTD-compliant structure
  const boxAmounts: Record<string, number> = {
    turnover: 0,           // Box 6
    costOfGoods: 0,        // Box 17
    adminCosts: 0,         // Box 20
    travel: 0,             // Box 24
    advertising: 0,        // Box 25
    professionalFees: 0,   // Box 26
    insurance: 0,          // Box 27
    bankCharges: 0,        // Box 28
    utilities: 0,          // Box 29
    otherExpenses: 0       // Box 30
  };
  
  const boxMapping: Record<number, keyof typeof boxAmounts> = {
    6: 'turnover',
    17: 'costOfGoods',
    20: 'adminCosts',
    24: 'travel',
    25: 'advertising',
    26: 'professionalFees',
    27: 'insurance',
    28: 'bankCharges',
    29: 'utilities',
    30: 'otherExpenses'
  };
  
  for (const tx of txs) {
    const category = tx.categoryId ? categoryMap.get(tx.categoryId) : null;
    if (!category?.mtdBox) continue;
    
    const boxKey = boxMapping[category.mtdBox];
    if (boxKey) {
      boxAmounts[boxKey] += Math.abs(tx.amount);
    }
  }
  
  // Calculate net profit
  const totalExpenses = boxAmounts.costOfGoods + boxAmounts.adminCosts + boxAmounts.travel +
    boxAmounts.advertising + boxAmounts.professionalFees + boxAmounts.insurance +
    boxAmounts.bankCharges + boxAmounts.utilities + boxAmounts.otherExpenses;
  
  const netProfit = boxAmounts.turnover - totalExpenses;
  
  // MTD Self-Employment JSON structure
  const mtdJson = {
    periodStart: startDate,
    periodEnd: endDate,
    generatedAt: new Date().toISOString(),
    selfEmployment: {
      turnover: Math.round(boxAmounts.turnover * 100) / 100,
      allowableExpenses: {
        costOfGoods: Math.round(boxAmounts.costOfGoods * 100) / 100,
        adminCosts: Math.round(boxAmounts.adminCosts * 100) / 100,
        travel: Math.round(boxAmounts.travel * 100) / 100,
        advertising: Math.round(boxAmounts.advertising * 100) / 100,
        professionalFees: Math.round(boxAmounts.professionalFees * 100) / 100,
        insurance: Math.round(boxAmounts.insurance * 100) / 100,
        bankCharges: Math.round(boxAmounts.bankCharges * 100) / 100,
        utilities: Math.round(boxAmounts.utilities * 100) / 100,
        otherExpenses: Math.round(boxAmounts.otherExpenses * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100
      },
      netProfit: Math.round(netProfit * 100) / 100
    }
  };
  
  return mtdJson;
});

// Get UK tax quarters
ipcMain.handle('tax:get-quarters', async (_, taxYear?: number) => {
  const year = taxYear || new Date().getFullYear();
  
  // UK tax year runs April to April
  return [
    {
      id: `${year}-Q1`,
      name: `Q1 ${year}`,
      startDate: `${year}-04-06`,
      endDate: `${year}-07-05`,
      deadline: `${year}-08-05`
    },
    {
      id: `${year}-Q2`,
      name: `Q2 ${year}`,
      startDate: `${year}-07-06`,
      endDate: `${year}-10-05`,
      deadline: `${year}-11-05`
    },
    {
      id: `${year}-Q3`,
      name: `Q3 ${year}`,
      startDate: `${year}-10-06`,
      endDate: `${year + 1}-01-05`,
      deadline: `${year + 1}-02-05`
    },
    {
      id: `${year}-Q4`,
      name: `Q4 ${year}/${year + 1}`,
      startDate: `${year + 1}-01-06`,
      endDate: `${year + 1}-04-05`,
      deadline: `${year + 1}-05-05`
    }
  ];
});

// Test IPC handler
ipcMain.handle('ping', () => 'pong');

ipcMain.handle('app:get-db-path', () => {
  return path.join(app.getPath('userData'), 'mtdman.db');
});

ipcMain.handle('app:import-db', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import Database',
    defaultPath: app.getPath('userData'),
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile'],
  });

  if (result.canceled || !result.filePaths.length) {
    return { imported: false };
  }

  const sourcePath = result.filePaths[0];
  const destPath = path.join(app.getPath('userData'), 'mtdman.db');

  if (sourcePath === destPath) {
    return { imported: false, reason: 'Same file' };
  }

  closeDB();
  fs.copyFileSync(sourcePath, destPath);
  initDB();

  mainWindow?.webContents.send('transactions:updated');
  return { imported: true, path: sourcePath };
});

// --- Demo Data Handlers ---
ipcMain.handle('demo:seed', async () => {
  const db = getDB();
  const demoTxs = generateDemoTransactions();
  let inserted = 0;

  for (const tx of demoTxs) {
    const existing = db.select().from(transactions).where(eq(transactions.id, tx.id)).get();
    if (!existing) {
      db.insert(transactions).values({
        id: tx.id,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        currency: tx.currency,
        merchant: tx.merchant,
        status: tx.status,
        accountId: tx.accountId,
        bankConnectionId: tx.bankConnectionId,
        metadata: tx.metadata,
        categoryId: tx.categoryId,
      }).run();
      inserted++;
    }
  }

  mainWindow?.webContents.send('transactions:updated');
  return { inserted };
});

ipcMain.handle('demo:clear', async () => {
  const db = getDB();

  const demoTxs = db.select()
    .from(transactions)
    .where(eq(transactions.accountId, DEMO_ACCOUNT_ID))
    .all();

  const deleted = demoTxs.length;

  db.delete(transactions)
    .where(eq(transactions.accountId, DEMO_ACCOUNT_ID))
    .run();

  mainWindow?.webContents.send('transactions:updated');
  return { deleted };
});