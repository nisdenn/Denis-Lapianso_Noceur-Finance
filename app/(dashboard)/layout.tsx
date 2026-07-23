import { cn } from "@/lib/utils";
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { getSettings } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="w-full min-h-screen relative"
      style={settings.backgroundImageUrl ? {
        backgroundImage: `url('${settings.backgroundImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : undefined}
    >
      <MobileHeader settings={settings} />
      <div className={cn("flex w-full h-screen overflow-hidden relative z-10", "p-4 md:p-6 md:gap-6")}>
        <Sidebar settings={settings} />
        <main className="flex-1 overflow-auto h-full pb-24 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
      {settings.backgroundImageUrl && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] z-0 pointer-events-none" />
      )}
    </div>
  );
}
