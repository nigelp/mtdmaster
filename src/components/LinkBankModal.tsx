import { useState, useEffect } from 'react';
import { X, Landmark, ShieldCheck, ArrowRight, Loader2, Search, ChevronRight } from 'lucide-react';

interface LinkBankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Institution {
  id: string;
  name: string;
  logo: string;
}

export default function LinkBankModal({ isOpen, onClose }: LinkBankModalProps) {
  const [step, setStep] = useState<'intro' | 'select-bank' | 'waiting'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && step === 'select-bank') {
      loadInstitutions();
    }
  }, [isOpen, step]);

  useEffect(() => {
    const removeListener = window.ipcRenderer.on('gocardless:success', (data: any) => {
      console.log('Bank connection successful:', data);
      alert(`Successfully linked ${data.accountCount} account(s)!`);
      setStep('intro');
      onClose();
    });
    return () => removeListener();
  }, [onClose]);

  const loadInstitutions = async () => {
    setIsLoading(true);
    try {
      const banks = await window.ipcRenderer.invoke('gocardless:get-institutions');
      setInstitutions(banks);
    } catch (err) {
      console.error('Failed to load banks:', err);
      setError('Failed to load bank list.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (institutionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = await window.ipcRenderer.invoke('gocardless:auth-url', institutionId);
      window.open(url, '_blank');
      setStep('waiting');
    } catch (err: any) {
      console.error('Failed to initiate connection:', err);
      setError('Failed to connect. Please check your internet or settings.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredBanks = institutions.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] editorial-shadow">
        <div className="bg-surface-container-low p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-container rounded-xl">
              <Landmark className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface font-headline">
                Link Bank Account
              </h2>
              <p className="text-sm text-on-surface-variant">
                Securely connect via Open Banking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 'intro' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-primary-container/20 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div className="text-sm text-on-surface">
                    <p className="font-bold">Bank-Grade Security</p>
                    <p className="text-on-surface-variant mt-1">
                      We use Open Banking to securely access your transaction data.
                      We never see your login credentials.
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    Connect multiple UK bank accounts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    Automatic transaction syncing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    90 days of history imported instantly
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setStep('select-bank')}
                className="btn btn-primary w-full justify-center py-3"
              >
                Continue
                <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <p className="text-[10px] text-center text-on-surface-variant uppercase tracking-widest">
                Powered by GoCardless · Regulated by the FCA
              </p>
            </div>
          ) : step === 'waiting' ? (
            <div className="space-y-6 py-8">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-primary animate-spin" strokeWidth={1} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-on-surface font-headline">
                  Complete authentication on your device
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Please complete the authentication process on your mobile device
                  or in the browser window that opened.
                </p>
                <p className="text-xs text-on-surface-variant/60 pt-2">
                  This window will automatically close when the connection is
                  complete.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Search your bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  autoFocus
                />
              </div>
              {error && (
                <div className="p-3 bg-error-container/20 text-error text-sm rounded-xl">
                  {error}
                </div>
              )}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" strokeWidth={1.5} />
                </div>
              ) : (
                <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => handleConnect(bank.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-all group text-left"
                    >
                      <div className="flex items-center gap-3">
                        {bank.logo && (
                          <img
                            src={bank.logo}
                            alt={bank.name}
                            className="w-8 h-8 object-contain rounded-lg"
                          />
                        )}
                        <span className="font-medium text-on-surface group-hover:text-primary transition-colors">
                          {bank.name}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary" strokeWidth={1.5} />
                    </button>
                  ))}
                  {filteredBanks.length === 0 && (
                    <div className="text-center py-8 text-on-surface-variant text-sm">
                      No banks found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
