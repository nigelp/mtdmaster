export interface ElectronAPI {
  ping: () => Promise<string>;
  db: {
    initialize: () => Promise<{ success: boolean; error?: string }>;
  };
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    getAll: () => Promise<Record<string, any>>;
  };
  secureStorage: {
    deletePassword: (service: string, account: string) => Promise<void>;
  };
  banking: {
    linkAccount: () => Promise<any>;
    getAccounts: () => Promise<any[]>;
    syncTransactions: (accountId: string) => Promise<any>;
  };
  transactions: {
    getAll: (filters?: any) => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    update: (id: string, data: any) => Promise<void>;
    categorize: (id: string, categoryId: number) => Promise<void>;
  };
  categories: {
    getAll: () => Promise<any[]>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<void>;
    delete: (id: number) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}