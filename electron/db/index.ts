import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';
import fs from 'fs';

let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;

export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export const initDB = () => {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'mtdman.db');

  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const runInit = (retryCount = 0): ReturnType<typeof drizzle> => {
    try {
      console.log(`Initializing database at: ${dbPath} (Attempt ${retryCount + 1})`);
      sqlite = new Database(dbPath);

      // Initialize Drizzle
      db = drizzle(sqlite, { schema });

      // Run Migrations
      const migrationsFolder = app.isPackaged
        ? path.join(process.resourcesPath, 'drizzle')
        : path.join(app.getAppPath(), 'drizzle');

      console.log('Running migrations from:', migrationsFolder);

      migrate(db, { migrationsFolder });
      console.log('Migrations completed successfully');

      return db;
    } catch (error: any) {
      console.error('Failed to initialize database:', error);

      const errorMessage = error.message || '';
      const causeMessage = error.cause?.message || '';
      const isConflict = errorMessage.includes('already exists') || causeMessage.includes('already exists');

      // Self-healing: If migration fails due to existing tables, reset DB
      // Limit retries to avoid infinite loops
      if (retryCount < 3 && isConflict) {
        console.warn('Database schema conflict detected. Resetting database...');

        if (sqlite) {
          try {
            sqlite.close();
          } catch (e) {
            console.error('Error closing DB:', e);
          }
          sqlite = null;
        }

        try {
          if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('Deleted corrupted database file:', dbPath);
          }
        } catch (e) {
          console.error('Failed to delete database file:', e);
          throw error; // If we can't delete, we can't fix it
        }

        // Retry init
        return runInit(retryCount + 1);
      }

      throw error;
    }
  };

  return runInit();
};

export const closeDB = () => {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
};