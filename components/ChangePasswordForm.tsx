'use client';

import { useState, useTransition } from 'react';
import { changePasswordAction } from '@/app/actions/settings';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

function PasswordInput({ name, placeholder }: { name: string; placeholder: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        required
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
        placeholder={placeholder}
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
  );
}

export default function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result && result.success) {
        toast.success(result.message);
        form.reset();
      } else {
        toast.error(result?.message || 'Failed to change password');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-1">Current Password</label>
        <PasswordInput name="currentPassword" placeholder="Enter current password" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-1">New Password</label>
        <PasswordInput name="newPassword" placeholder="Enter new password" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-1">Confirm Password</label>
        <PasswordInput name="confirmPassword" placeholder="Repeat new password" />
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save New Password'}
        </button>
      </div>
    </form>
  );
}
