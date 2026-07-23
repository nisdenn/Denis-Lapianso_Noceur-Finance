'use client';

import { useState } from 'react';
import { submitWallet } from '@/app/actions';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AddWalletForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);
    try {
      const formData = new FormData(form);
      await submitWallet(formData);
      toast.success('Wallet added successfully!');
      form.reset();
      setIsOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add wallet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-3 bg-white/60 hover:bg-white border border-slate-200 border-dashed rounded-2xl text-slate-500 font-bold text-sm flex items-center justify-center gap-2 transition-all"
      >
        <Plus className="w-4 h-4" />
        Add New Wallet
      </button>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Add New Wallet</h3>
        <button onClick={() => setIsOpen(false)} className="text-xs text-slate-400 hover:text-slate-600 font-medium">Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
          <input 
            name="name"
            type="text" 
            required 
            placeholder="e.g., BCA, Cash, OVO"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Balance</label>
          <input 
            name="initialBalance"
            type="number" 
            placeholder="e.g., 5000000"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Wallet'}
        </button>
      </form>
    </div>
  );
}
