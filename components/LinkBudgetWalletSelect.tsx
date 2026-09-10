'use client';

import { useTransition } from 'react';
import { linkBudgetWalletAction } from '@/app/actions';
import { Link2 } from 'lucide-react';

export default function LinkBudgetWalletSelect({ 
  id, 
  currentWalletId,
  currentWalletName, 
  wallets 
}: { 
  id: string; 
  currentWalletId?: string;
  currentWalletName?: string; 
  wallets: { id: string; name: string }[]; 
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWalletId = e.target.value;
    startTransition(() => {
      linkBudgetWalletAction(id, selectedWalletId);
    });
  };

  const selectedValue = currentWalletId 
    ? currentWalletId 
    : (wallets.find(wallet => wallet.name === currentWalletName)?.id || '');

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
      <Link2 className="w-3 h-3 text-slate-400" />
      <select 
        value={selectedValue}
        onChange={handleChange}
        disabled={isPending}
        className="bg-transparent text-xs font-bold text-slate-500 outline-none w-full cursor-pointer disabled:opacity-50"
      >
        <option value="">Unlinked (None)</option>
        {wallets.map(w => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
    </div>
  );
}
