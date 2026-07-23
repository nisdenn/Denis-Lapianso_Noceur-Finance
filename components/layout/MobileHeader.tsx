import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { AppSettings } from '@/lib/db';

export function MobileHeader({ settings }: { settings?: AppSettings }) {
  return (
    <header className="flex justify-between items-center bg-white/60 backdrop-blur-md border border-white/40 p-4 rounded-3xl shadow-sm md:hidden z-20 relative mx-4 mt-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white shadow-sm">
          <img src="/noceur-logo.png" alt="Noceur Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">Noceur</h1>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Finance</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <form action={logoutAction}>
          <button type="submit" className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </form>
        <Link href="/settings" className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 block">
           <img 
              src={settings?.profileImageUrl || 'https://i.pravatar.cc/150?img=11'} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
        </Link>
      </div>
    </header>
  );
}
