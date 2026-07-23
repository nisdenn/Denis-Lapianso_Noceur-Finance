export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import RemindersForm from '@/components/RemindersForm';
import PushNotificationManager from '@/components/PushNotificationManager';
import ReminderSettingsForm from '@/components/ReminderSettingsForm';

export default async function RemindersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: reminders } = await supabase
    .from('reminders')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Reminders & Notifications</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your financial reminders and notifications.</p>
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-2xl mx-auto space-y-6 pb-8">
            
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Notification Settings</h2>
              <ReminderSettingsForm />
              <PushNotificationManager />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Reminder Schedule</h2>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <RemindersForm initialReminders={reminders || []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
