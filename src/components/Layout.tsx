import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, FolderTree, FileBarChart, Settings, User, Database, Trash2, X, FolderOpen } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/categories': 'Categories',
  '/reports': 'Tax Reports',
  '/settings': 'Settings',
};

export default function Layout() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbPath, setDbPath] = useState('');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      setShowDemoPanel(prev => !prev);
      setDemoStatus(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    window.ipcRenderer.invoke('app:get-db-path').then((p: string) => {
      if (p) setDbPath(p);
    }).catch(() => {});
  }, []);

  const handleSeed = async () => {
    setIsLoading(true);
    setDemoStatus(null);
    try {
      const result = await window.ipcRenderer.invoke('demo:seed');
      setDemoStatus(`Loaded ${result.inserted} demo transactions`);
    } catch (err: any) {
      setDemoStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    setDemoStatus(null);
    try {
      const result = await window.ipcRenderer.invoke('demo:clear');
      setDemoStatus(`Cleared ${result.deleted} demo transactions`);
    } catch (err: any) {
      setDemoStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDb = async () => {
    setIsLoading(true);
    setDemoStatus(null);
    try {
      const result = await window.ipcRenderer.invoke('app:import-db');
      if (result.imported) {
        setDemoStatus(`Imported database from ${result.path.split(/[\\/]/).pop()}`);
      }
    } catch (err: any) {
      setDemoStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-surface">
      <aside className="fixed left-0 top-0 h-full flex flex-col py-8 bg-surface-container-low w-64 z-50">
        <div className="px-6 mb-10">
          <h1 className="text-xl font-bold text-on-surface font-headline">MTD Master</h1>
          <p className="text-[10px] tracking-widest uppercase font-bold text-on-surface-variant/60 mt-1">
            UK Tax Year 2024/25
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-colors duration-200 ${
                  isActive
                    ? 'text-primary font-bold border-r-4 border-primary'
                    : 'text-on-surface/70 hover:bg-surface-container-lowest/50'
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide font-headline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-6 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest/40">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
              <User className="w-5 h-5 text-on-primary-container" strokeWidth={1.5} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">Tax User</p>
              <p className="text-[10px] text-on-surface-variant">Free Tier</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen flex flex-col">
        <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-40 bg-surface/80 backdrop-blur-md">
          <h2 className="text-lg font-black text-on-surface font-headline">{pageTitle}</h2>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      {showDemoPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container rounded-2xl shadow-2xl p-6 w-96 border border-outline-variant/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface font-headline">Data Management</h3>
              <button
                onClick={() => setShowDemoPanel(false)}
                className="p-1 rounded-lg hover:bg-surface-container-highest/60 text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSeed}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                {isLoading ? 'Working...' : 'Load Demo Transactions'}
              </button>

              <button
                onClick={handleClear}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-error/10 hover:bg-error/20 text-error text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isLoading ? 'Working...' : 'Clear Demo Data'}
              </button>

              <div className="border-t border-outline-variant/20 pt-3">
                <button
                  onClick={handleImportDb}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-highest/40 hover:bg-surface-container-highest/60 text-on-surface text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <FolderOpen className="w-4 h-4" />
                  {isLoading ? 'Working...' : 'Import Database File'}
                </button>
              </div>
            </div>

            {demoStatus && (
              <p className="mt-3 text-xs text-on-surface-variant text-center">{demoStatus}</p>
            )}

            {dbPath && (
              <div className="mt-3 p-3 rounded-lg bg-surface-container-lowest/40">
                <p className="text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">Current Database</p>
                <p className="text-[10px] text-on-surface-variant font-mono break-all select-all leading-relaxed">{dbPath}</p>
              </div>
            )}

            <p className="mt-3 text-[10px] text-on-surface-variant/50 text-center">Ctrl+Shift+D to toggle</p>
          </div>
        </div>
      )}
    </div>
  );
}