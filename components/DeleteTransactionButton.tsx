'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { removeTransactionAction } from '@/app/actions';

export default function DeleteTransactionButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      startTransition(() => {
        removeTransactionAction(id);
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
      title="Delete Transaction"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
