import { useState, useEffect } from 'react';
import { Landmark, Key, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Lightbulb, Database } from 'lucide-react';

export default function Settings() {
  const [secretId, setSecretId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dbPath, setDbPath] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const id = await window.ipcRenderer.invoke('settings:get', 'gc_secret_id');
        const key = await window.ipcRenderer.invoke('settings:get', 'gc_secret_key');
        if (id) setSecretId(id);
        if (key) setSecretKey(key);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    const loadDbPath = async () => {
      try {
        const p = await window.ipcRenderer.invoke('app:get-db-path');
        if (p) setDbPath(p);
      } catch (err) {
        console.error('Failed to get db path:', err);
      }
    };
    loadSettings();
    loadDbPath();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setStatus('idle');
    try {
      await window.ipcRenderer.invoke('gocardless:save-secrets', {
        secretId,
        secretKey,
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-12 py-10 max-w-5xl">
      <div className="mb-12">
        <h2 className="text-4xl font-extrabold font-headline text-on-background tracking-tight mb-2">
          Settings
        </h2>
        <p className="text-on-surface-variant text-lg">
          Configure your application preferences and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <section className="glass-card rounded-[2rem] p-10 border border-white/40 editorial-shadow relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-primary">
                <Landmark className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-headline">Open Banking Connect</h3>
                <p className="text-on-surface-variant text-sm">
                  Connect your business bank account for automated tax tracking
                </p>
              </div>
            </div>

            <div className="space-y-8 max-w-2xl">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">
                  Secret ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={secretId}
                    onChange={(e) => setSecretId(e.target.value)}
                    placeholder="gc_live_XXXXX..."
                    className="input pr-12"
                  />
                  <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" strokeWidth={1.5} />
                </div>
                <p className="mt-2 text-[10px] text-on-surface-variant/60 ml-1">
                  Your unique merchant identifier from the GoCardless dashboard.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
                  >
                    {showKey ? (
                      <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                    ) : (
                      <Eye className="w-5 h-5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-on-surface-variant/60 ml-1">
                  Never share this key with anyone. It grants access to your payment flows.
                </p>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-surface-variant/30">
                <div className="flex items-center gap-2">
                  {status === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-tertiary" />
                      <span className="text-xs font-medium text-tertiary">Saved successfully</span>
                    </>
                  ) : status === 'error' ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-error" />
                      <span className="text-xs font-medium text-error">Failed to save</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      <span className="text-xs font-medium text-tertiary">
                        Connection ready for verification
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={isLoading || !secretId || !secretKey}
                  className="btn btn-primary px-10 py-4 font-headline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="flex gap-8 items-start opacity-70">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div className="max-w-xl">
            <h4 className="font-bold text-sm mb-1">Need help finding your credentials?</h4>
            <p className="text-xs leading-relaxed text-on-surface-variant">
              Log into your GoCardless dashboard, navigate to Developers &gt; Access
              Tokens. If you haven't created one yet, click 'Create Token' and ensure
              you select 'Read Access' for bank transactions.
            </p>
          </div>
        </div>

        <section className="glass-card rounded-3xl p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Data Management</h3>
              <p className="text-xs text-on-surface-variant">Database info and demo data controls</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Press <kbd className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-xs font-mono font-bold">Ctrl+Shift+D</kbd> anywhere
              in the app to load or clear demo transactions. Demo data lets you explore MTD Master without connecting a bank account.
            </p>

            {dbPath && (
              <div className="p-4 rounded-xl bg-surface-container-low">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Database Location</p>
                <p className="text-xs text-on-surface-variant font-mono break-all select-all">{dbPath}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-16 py-8 flex justify-between items-center text-[10px] text-on-surface-variant uppercase tracking-widest font-bold border-t border-surface-container-low">
        <div className="flex gap-8">
          <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
          <span className="hover:text-primary transition-colors cursor-pointer">Security Standards</span>
        </div>
        <span>v0.1.0</span>
      </footer>
    </div>
  );
}