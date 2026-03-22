import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Wallet,
  ClipboardCheck,
  ChevronRight,
  Calendar,
  CreditCard,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-10 max-w-6xl mx-auto w-full space-y-12">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-dim p-12 text-on-primary">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-extrabold font-headline leading-tight tracking-tight mb-4">
            Welcome to MTD Master
          </h1>
          <p className="text-lg opacity-90 font-medium">
            Making Tax Digital shouldn't be a headache. We've simplified your UK
            freelancer finances into easy, bite-sized tasks.
          </p>
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate('/reports')}
              className="bg-surface-container-lowest text-primary px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
            >
              View Tax Estimate
            </button>
            <button className="bg-primary-dim/30 backdrop-blur-md border border-white/20 px-6 py-3 rounded-lg font-bold text-sm hover:bg-white/10 transition-colors">
              How it works
            </button>
          </div>
        </div>
        <div className="absolute right-[-10%] top-[-20%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute right-[5%] bottom-[-10%] w-[300px] h-[300px] bg-tertiary/20 rounded-full blur-2xl" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 transition-transform hover:scale-[1.01] duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold font-headline">Getting Started</h3>
              <p className="text-on-surface-variant text-sm mt-1">
                Complete these 3 steps to be tax-ready.
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
              <span className="font-bold">33%</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low/50 border border-primary/10">
              <div className="w-8 h-8 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center">
                <CheckCircle className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Connect your bank account</p>
                <p className="text-xs text-on-surface-variant">
                  Securely import your business transactions.
                </p>
              </div>
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">
                Done
              </span>
            </div>

            <div
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low group hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-outline-variant/20"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center group-hover:bg-primary-container group-hover:text-primary transition-colors">
                <Wallet className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Categorise your first 5 expenses</p>
                <p className="text-xs text-on-surface-variant">
                  Help us learn what counts as a tax deduction.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low group hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-outline-variant/20">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center group-hover:bg-primary-container group-hover:text-primary transition-colors">
                <ClipboardCheck className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Set your tax goal</p>
                <p className="text-xs text-on-surface-variant">
                  Tell us your expected annual income for better estimates.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-8 flex-1 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Next Deadline
              </h4>
              <p className="text-2xl font-black font-headline text-on-surface">
                31 Jan 2025
              </p>
              <p className="text-sm text-on-surface-variant mt-2">
                Self-Assessment Filing
              </p>
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error-container/20 text-error text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                  Action Required
                </span>
              </div>
            </div>
            <div className="absolute bottom-[-20px] right-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar className="w-28 h-28" strokeWidth={0.5} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 flex-1 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Quick Support
              </h4>
              <p className="text-sm text-on-surface-variant">
                Have a question about UK tax rules?
              </p>
              <button className="mt-4 flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                Chat with MTD Assistant
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold font-headline">Recent Income</h3>
            <p className="text-on-surface-variant text-sm mt-1">
              Your latest earnings imported from your accounts.
            </p>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-primary font-bold text-sm px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            View All
          </button>
        </div>

        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="divide-y divide-surface-container-high/50">
            <div className="flex items-center justify-between p-6 bg-surface-container-lowest/40 hover:bg-white transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold text-sm">Transfer from Stripe</p>
                  <p className="text-xs text-on-surface-variant">
                    24 Oct 2024 · Project Payment
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-on-surface">+£1,450.00</p>
                <p className="text-[10px] text-tertiary font-bold uppercase">
                  Categorised
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-surface-container-lowest/40 hover:bg-white transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold text-sm">Direct Deposit: Creative Agency</p>
                  <p className="text-xs text-on-surface-variant">
                    20 Oct 2024 · Invoice #042
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-on-surface">+£820.00</p>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">
                  Needs Review
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}