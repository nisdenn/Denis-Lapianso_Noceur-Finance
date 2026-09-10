export const dynamic = "force-dynamic";
import { getBudgets, getWallets } from '@/lib/db';
import { formatCurrency } from '@/lib/finance';
import AddBudgetForm from '@/components/AddBudgetForm';
import DeleteBudgetButton from '@/components/DeleteBudgetButton';
import LinkBudgetWalletSelect from '@/components/LinkBudgetWalletSelect';

export const revalidate = 0;

export default async function BudgetsPage() {
  const budgets = await getBudgets();
  const wallets = await getWallets();

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Budgets & Pockets</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your budget pockets and monitor your spending limits.</p>
      </div>

      <div className="max-w-md">
        <AddBudgetForm />
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm overflow-y-auto">
        {budgets.length === 0 ? (
          <div className="flex h-full justify-center items-center text-slate-400">
            <p className="font-bold">No budgets found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((b, i) => {
              const perc = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) * 100 : 0;
              const colors = [
                'bg-indigo-500', 'bg-orange-400', 'bg-blue-400', 'bg-emerald-500', 'bg-rose-400'
              ];
              const color = colors[i % colors.length];

              return (
                <div key={b.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-slate-800">{b.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                          {perc.toFixed(0)}%
                        </span>
                        <DeleteBudgetButton id={b.id} name={b.name} />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Current</span>
                        <span className="font-bold text-slate-700">{formatCurrency(b.currentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Target</span>
                        <span className="font-bold text-slate-700">{formatCurrency(b.targetAmount)}</span>
                      </div>
                    </div>

                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, perc)}%` }}></div>
                    </div>
                  </div>
                  
                  <LinkBudgetWalletSelect 
                    id={b.id} 
                    currentWalletId={b.walletId}
                    currentWalletName={b.walletName} 
                    wallets={wallets} 
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
