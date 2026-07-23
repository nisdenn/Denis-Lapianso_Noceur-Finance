'use client';
import { useState, useTransition } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { editWalletBalanceAction } from '@/app/actions';

export default function EditWalletForm({ name, currentBalance }: { name: string, currentBalance: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState(currentBalance.toString());

  const handleSave = () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('balance', balance);
    startTransition(() => {
      editWalletBalanceAction(formData);
      setIsEditing(false);
    });
  };

  if (!isEditing) {
    return (
      <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Balance">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="flex items-center bg-white rounded-lg border border-indigo-200 overflow-hidden shadow-sm">
      <span className="px-2 text-xs font-bold text-slate-400 bg-slate-50 border-r border-slate-100">Rp</span>
      <input 
        type="number"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        className="w-24 text-sm font-bold text-slate-800 px-2 py-1 outline-none"
        disabled={isPending}
        autoFocus
      />
      <button onClick={handleSave} disabled={isPending} className="p-1.5 text-emerald-500 hover:bg-emerald-50">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setIsEditing(false)} disabled={isPending} className="p-1.5 text-slate-400 hover:bg-slate-50 border-l border-slate-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
