'use client';

import { useState, useTransition } from 'react';
import { adminAddUserAction } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminAddUserForm() {
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      try {
        const result = await adminAddUserAction(formData);
        if (result && result.success) {
          toast.success(result.message || 'User berhasil ditambahkan');
          form.reset();
        } else {
          const errorMsg = typeof result?.message === 'string' ? result.message : 'Gagal menambahkan user';
          toast.error(errorMsg);
        }
      } catch (err: any) {
        const errorMsg = typeof err?.message === 'string' ? err.message : 'Gagal menambahkan user';
        toast.error(errorMsg);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Username (or Email)</label>
        <input 
          name="username" 
          type="text" 
          required
          placeholder="contoh: user@gmail.com"
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
        <div className="relative">
          <input 
            name="password" 
            type={visible ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="Minimal 6 karakter"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Role</label>
        <select 
          name="role" 
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-indigo-600 text-white font-bold py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm mt-2 disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Add User'}
      </button>
    </form>
  );
}

