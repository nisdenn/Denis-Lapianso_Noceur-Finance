'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { removeWalletAction } from '@/app/actions';

export default function DeleteWalletButton({ name }: { name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(() => {
      removeWalletAction(name);
    });
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
