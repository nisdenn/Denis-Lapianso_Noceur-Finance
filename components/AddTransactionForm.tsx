'use client';

import { useState } from 'react';
import { submitTransaction } from '@/app/actions';

import { toast } from 'sonner';

export default function AddTransactionForm({ wallets }: { wallets: { name: string }[] }) {
  const [category, setCategory] = useState<'Expense' | 'Income' | 'Transaction'>('Expense');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);
    try {
      const formData = new FormData(form);
      // Ensure the category value from the state is used
      formData.set('category', category);
      await submitTransaction(formData);
      toast.success('Transaction added successfully!');
      form.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-3 flex-1" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (Rp)</label>
          <input required type="number" name="amount" placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
          <select 
            name="category" 
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
            <option value="Transaction">Transfer</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
        <input required type="text" name="description" placeholder="e.g. Dinner, Salary" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {category === 'Income' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">To Wallet</label>
            <select name="toAccountId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="">-- Select Wallet --</option>
              {wallets.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
        
        {category === 'Expense' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">From Wallet</label>
            <select name="fromAccountId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="">-- Select Wallet --</option>
              {wallets.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {category === 'Transaction' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">From Wallet</label>
              <select name="fromAccountId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">-- Select Wallet --</option>
                {wallets.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">To Wallet</label>
              <select name="toAccountId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">-- Select Wallet --</option>
                {wallets.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        )}

        {(category === 'Expense' || category === 'Income') && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
            <input required type="date" name="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        )}
      </div>

      {category === 'Transaction' && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
          <input required type="date" name="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
      )}

      <button disabled={isSubmitting} type="submit" className="mt-auto w-full bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200/50 disabled:opacity-70 disabled:cursor-not-allowed">
        {isSubmitting ? 'Adding...' : 'Add Transaction'}
      </button>
    </form>
  );
}
