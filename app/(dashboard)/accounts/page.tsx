import { getWallets } from '@/lib/db';
import { formatCurrency } from '@/lib/finance';

export const revalidate = 0;

export default async function AccountsPage() {
  const accounts = await getWallets();

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Accounts</h1>
        <p className="text-xs text-slate-500 mt-1">Overview of your linked accounts and their balances.</p>
      </div>
      
      <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm overflow-y-auto">
        {accounts.length === 0 ? (
          <div className="flex h-full justify-center items-center text-slate-400">
            <p className="font-bold">No accounts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <div key={acc.name} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                    {acc.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500">{acc.name}</h3>
                  <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(acc.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
