export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/db';
import { changePasswordAction, updateSettingsAction } from '@/app/actions/settings';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SettingsForm from '@/components/SettingsForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import PushNotificationManager from '@/components/PushNotificationManager';
export default async function SettingsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const settings = await getSettings();


  const currentTab = searchParams.tab || 'profile';

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure your application preferences.</p>
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm flex flex-col overflow-hidden">
        
        {/* Settings Navigation Bar */}
        <div className="flex gap-6 border-b border-slate-200 pb-4 mb-6 shrink-0 overflow-x-auto">
          <Link 
            href="?tab=profile" 
            className={`text-sm font-bold pb-4 -mb-4 transition-colors ${currentTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Profile & Security
          </Link>
          <Link 
            href="?tab=general" 
            className={`text-sm font-bold pb-4 -mb-4 transition-colors ${currentTab === 'general' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            General
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-2xl mx-auto space-y-8 pb-8">
            
            {currentTab === 'profile' && (
              <>
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-800">Profile & Appearance</h2>
                  <SettingsForm settings={settings} />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
                  <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm max-w-2xl">
                    <ChangePasswordForm />
                  </div>
                </div>
              </>
            )}

            {currentTab === 'general' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">General</h2>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Currency</p>
                    <p className="text-xs text-slate-500 mt-0.5">Set your default currency for display.</p>
                  </div>
                  <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="IDR">IDR (Rp)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}
