'use client';

import { useState } from 'react';
import { saveReminderAction, deleteReminderAction } from '@/app/actions/reminders';
import { Bell, Clock, Trash2, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RemindersForm({ initialReminders = [] }: { initialReminders?: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    frequency: 'daily',
    time: '08:00',
    day_of_week: '1',
    is_active: 'true'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      
      await saveReminderAction(data);
      setIsAdding(false);
      setFormData({
        title: '',
        frequency: 'daily',
        time: '08:00',
        day_of_week: '1',
        is_active: 'true'
      });
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert('Failed to save reminder: ' + (error.message || String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;
    setDeletingId(id);
    try {
      await deleteReminderAction(id);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to delete reminder');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (reminder: any) => {
    try {
      const data = new FormData();
      data.append('id', reminder.id);
      data.append('title', reminder.title);
      data.append('frequency', reminder.frequency);
      data.append('time', reminder.time);
      if (reminder.day_of_week !== null) data.append('day_of_week', reminder.day_of_week.toString());
      data.append('is_active', (!reminder.is_active).toString());
      
      await saveReminderAction(data);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to toggle reminder');
    }
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-4">
      {initialReminders.length > 0 ? (
        <div className="space-y-3">
          {initialReminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggleActive(reminder)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${reminder.is_active ? 'bg-indigo-500 justify-end' : 'bg-slate-300 justify-start'}`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
                <div>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {reminder.title}
                    {reminder.is_system_default && (
                      <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-sm">Default</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3" />
                      <input 
                        type="time" 
                        defaultValue={reminder.time.substring(0, 5)} 
                        onBlur={(e) => {
                          if(e.target.value !== reminder.time.substring(0, 5)) {
                            const newReminder = {...reminder, time: e.target.value};
                            handleToggleActive(newReminder); // saveReminderAction is used inside
                          }
                        }}
                        className="bg-transparent outline-none w-[42px] cursor-pointer"
                      />
                    </span>
                    <span className="capitalize">{reminder.frequency}</span>
                    {reminder.frequency === 'weekly' && reminder.day_of_week !== null && (
                      <span>({days[reminder.day_of_week]})</span>
                    )}
                  </div>
                </div>
              </div>
              {!reminder.is_system_default && (
                <button
                  onClick={() => handleDelete(reminder.id)}
                  disabled={deletingId === reminder.id}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  {deletingId === reminder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm">
          No reminders set yet.
        </div>
      )}

      {isAdding ? (
        <form onSubmit={handleSubmit} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Log daily expenses"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
              <select 
                value={formData.frequency}
                onChange={e => setFormData({...formData, frequency: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
              <input 
                required
                type="time" 
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {formData.frequency === 'weekly' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
              <select 
                value={formData.day_of_week}
                onChange={e => setFormData({...formData, day_of_week: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {days.map((day, i) => <option key={i} value={i}>{day}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Reminder'}
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Reminder
        </button>
      )}
    </div>
  );
}
