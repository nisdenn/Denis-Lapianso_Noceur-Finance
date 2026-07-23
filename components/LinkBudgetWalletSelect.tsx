'use client';

import { useTransition } from 'react';
import { linkBudgetWalletAction } from '@/app/actions';
import { Link2 } from 'lucide-react';

export default function LinkBudgetWalletSelect({ 
  id, 
  currentWalletName, 
  wallets 
}: { 
  id: string, 
  currentWalletName?: string, 
  wallets: { name: string }[] 
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWallet = e.target.value;
    startTransition(() => {
      linkBudgetWalletAction(id, newWallet);
    });
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
      <Link2 className="w-3 h-3 text-slate-400" />
      <select 
        value={currentWalletName || ''}
        onChange={handleChange}
        disabled={isPending}
        className="bg-transparent text-xs font-bold text-slate-500 outline-none w-full cursor-pointer disabled:opacity-50"
      >
        <option value="">Unlinked (None)</option>
        {wallets.map(w => (
          <option key={w.name} value={w.name}>{w.name}</option>
        ))}
      </select>
    </div>
  );
}
