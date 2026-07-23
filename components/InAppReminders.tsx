'use client';

import { useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { completeReminderAction } from '@/app/actions/reminders';

export default function InAppReminders({ dueReminders }: { dueReminders: any[] }) {
  const [reminders, setReminders] = useState(dueReminders);
  const [completingId, setCompletingId] = useState<string | null>(null);

  if (reminders.length === 0) return null;

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      await completeReminderAction(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
      alert('Failed to mark reminder as complete');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="bg-indigo-600 rounded-3xl p-5 shadow-lg mb-6 flex flex-col md:flex-row items-center gap-4 text-white">
      <div className="bg-indigo-500 p-3 rounded-2xl flex-shrink-0">
        <Bell className="w-6 h-6 text-indigo-50" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg mb-1">
          Kamu punya {reminders.length} reminder hari ini
        </h3>
        <div className="flex flex-col gap-2 mt-3">
          {reminders.map(reminder => (
            <div key={reminder.id} className="flex items-center justify-between bg-indigo-500/50 hover:bg-indigo-500/80 transition-colors px-4 py-2.5 rounded-xl">
              <span className="font-medium text-sm flex items-center gap-2">
                {reminder.title}
                {reminder.is_system_default && (
                  <span className="text-[9px] uppercase font-bold bg-indigo-400 text-white px-1.5 py-0.5 rounded-sm">Default</span>
                )}
              </span>
              <button 
                onClick={() => handleComplete(reminder.id)}
                disabled={completingId === reminder.id}
                className="bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {completingId === reminder.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Selesai
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
