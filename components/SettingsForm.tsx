'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AppSettings } from '@/lib/db';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

function isDirectImageUrl(url: string) {
  try {
    const normalized = url.split('?')[0].toLowerCase();
    return IMAGE_EXTENSIONS.some(ext => normalized.endsWith(ext));
  } catch {
    return false;
  }
}

import { toast } from 'sonner';

export default function SettingsForm({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition();
  const [profileImageUrl, setProfileImageUrl] = useState(settings.profileImageUrl || '');
  const router = useRouter();

  const profileImageUrlValid = profileImageUrl === '' || isDirectImageUrl(profileImageUrl);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileImageUrlValid) return;

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success("Profile settings updated successfully");
        router.refresh();
      } else {
        toast.error('Save settings failed');
        console.error('Save settings failed');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">

        
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Display Name</label>
          <p className="text-xs text-slate-500 mb-2">How you would like to be called.</p>
          <input 
            type="text" 
            name="userName"
            defaultValue={settings.userName}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Profile Image URL</label>
          <p className="text-xs text-slate-500 mb-2">Paste a direct image URL that ends with .jpg, .png, .gif, .webp or .svg. Pinterest page links will not render as an image.</p>
          <input 
            type="url" 
            name="profileImageUrl"
            value={profileImageUrl}
            onChange={(event) => setProfileImageUrl(event.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="https://example.com/me.jpg"
          />
          {!profileImageUrlValid && (
            <p className="mt-2 text-sm text-rose-600">The URL must be a direct image link (e.g. ending with .jpg or .png).</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Custom Background URL</label>
          <p className="text-xs text-slate-500 mb-2">Personalize the app background. (Leave empty for default)</p>
          <input 
            type="url" 
            name="backgroundImageUrl"
            defaultValue={settings.backgroundImageUrl}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="https://example.com/background.jpg"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending || !profileImageUrlValid}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {!profileImageUrlValid ? 'Enter a direct image URL' : isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </form>
  );
}
