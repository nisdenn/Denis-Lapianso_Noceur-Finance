import Link from 'next/link';
import { Home, List, PieChart, Target, Settings, Wallet, Shield, LogOut, Activity, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSettings } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import { logoutAction } from '@/app/actions/auth';

export async function Sidebar({ settings }: { settings?: AppSettings }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  
  const links = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Transactions', href: '/transactions', icon: List },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Wallets', href: '/wallets', icon: Wallet },
    { name: 'Reminders', href: '/reminders', icon: Bell },
    { name: 'Activity', href: '/activity', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isAdmin = profile?.role === 'admin';

  if (isAdmin) {
    links.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <div className="flex flex-col w-64 bg-white/60 backdrop-blur-md border border-white/40 shadow-sm rounded-3xl p-6 shrink-0 hidden md:flex">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white shadow-sm">
          <img src="/noceur-logo.png" alt="Noceur Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">Noceur</h1>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Finance</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8 p-3 bg-white/50 rounded-2xl border border-white/50">
        <img 
          src={settings?.profileImageUrl || 'https://i.pravatar.cc/150?img=11'} 
          alt="Profile" 
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="overflow-hidden">
          <p className="text-xs text-slate-400 font-semibold">Welcome back,</p>
          <p className="text-sm font-bold text-slate-800 truncate">{settings?.userName || user?.email?.split('@')[0] || 'User'}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors hover:bg-white/80 hover:shadow-sm text-slate-500"
              )}
            >
              <Icon className="w-4 h-4" />
              {link.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="pt-6 mt-auto shrink-0">
        <form action={logoutAction}>
          <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors hover:bg-rose-50 hover:text-rose-600 text-slate-500">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
