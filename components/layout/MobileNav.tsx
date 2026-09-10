import Link from 'next/link';
import { Home, List, PieChart, Target, Settings, Wallet, Shield, Activity, Bell } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

export async function MobileNav() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  if (!user) return null;

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

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';

  if (isAdmin) {
    links.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-3 z-50 px-6 flex justify-between items-center safe-area-bottom overflow-x-auto">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors px-2 shrink-0"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{link.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
