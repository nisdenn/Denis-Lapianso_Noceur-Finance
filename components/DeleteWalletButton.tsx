'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { removeWalletAction } from '@/app/actions';

export default function DeleteWalletButton({ id, name }: { id: string; name?: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${name || 'this wallet'}?`)) {
      startTransition(() => {
        removeWalletAction(id);
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
      title="Delete Wallet"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
