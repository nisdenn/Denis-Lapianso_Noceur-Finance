import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ActivityCalendar from '@/components/ActivityCalendar';
import { Flame, Trophy, Activity as ActivityIcon } from 'lucide-react';

export default async function ActivityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const aYearAgo = new Date();
  aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, date, type')
    .eq('user_id', user.id)
    .gte('date', aYearAgo.toISOString().substring(0, 10))
    .is('deleted_at', null);

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Activity & Streaks</h1>
        <p className="text-xs text-slate-500 mt-1">Track your consistency in managing finances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold mb-1">Current Streak</p>
            <div className="flex items-end gap-2">
              <h2 className="text-2xl font-black text-slate-800 leading-none">{streak?.current_streak || 0}</h2>
              <span className="text-sm font-bold text-slate-400 mb-0.5">days</span>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold mb-1">Longest Streak</p>
            <div className="flex items-end gap-2">
              <h2 className="text-2xl font-black text-slate-800 leading-none">{streak?.longest_streak || 0}</h2>
              <span className="text-sm font-bold text-slate-400 mb-0.5">days</span>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
            <ActivityIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold mb-1">Total Logs</p>
            <div className="flex items-end gap-2">
              <h2 className="text-2xl font-black text-slate-800 leading-none">{streak?.total_transactions || 0}</h2>
              <span className="text-sm font-bold text-slate-400 mb-0.5">transactions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Contribution Calendar</h2>
        <div className="flex-1 overflow-y-auto">
          <ActivityCalendar transactions={transactions || []} />
        </div>
      </div>
    </div>
  );
}
