'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { removeBudgetAction } from '@/app/actions';

export default function DeleteBudgetButton({ id, name }: { id: string, name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(() => {
      removeBudgetAction(id);
    });
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
      title="Delete Pocket"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
