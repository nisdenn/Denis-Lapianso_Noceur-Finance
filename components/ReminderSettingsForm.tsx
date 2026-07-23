'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

export default function ReminderSettingsForm() {
  const [isPending, startTransition] = useTransition();

  const testCron = () => {
    startTransition(async () => {
      toast.info("Mengirim test notifikasi...");
      try {
        const response = await fetch('/api/cron/reminders?test=true');
        const data = await response.json();
        if (response.ok) {
          toast.success(`Berhasil! ${data.pushSent} push notification terkirim.`);
        } else {
          toast.error('Gagal: ' + (data.error || 'Unknown error'));
        }
      } catch {
        toast.error('Gagal menghubungi server.');
      }
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Uji Coba Notifikasi</h3>
        <p className="text-xs text-slate-500 mt-1">
          Simulasikan Vercel Cron — kirim push notification sekarang juga untuk semua reminder aktif (abaikan jadwal jam).
        </p>
      </div>
      <button
        onClick={testCron}
        disabled={isPending}
        type="button"
        className="shrink-0 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Mengirim...' : 'Kirim Test Notifikasi'}
      </button>
    </div>
  );
}
