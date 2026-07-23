'use client';

import { useMemo } from 'react';

export default function ActivityCalendar({ transactions }: { transactions: any[] }) {
  // Calculate frequencies
  const frequencies = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      const dateStr = t.date.substring(0, 10);
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    });
    return map;
  }, [transactions]);

  // Generate last 365 days
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const d = [];
    const currentDayOfWeek = today.getDay(); // 0 is Sunday
    // We want to start from the Sunday of 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (52 * 7) - currentDayOfWeek);
    
    for (let i = 0; i <= (52 * 7) + currentDayOfWeek; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().substring(0, 10);
      d.push({
        date,
        dateStr,
        count: frequencies.get(dateStr) || 0,
      });
    }
    return d;
  }, [frequencies]);

  // Group by weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count === 1) return 'bg-indigo-200';
    if (count <= 3) return 'bg-indigo-400';
    return 'bg-indigo-600';
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="min-w-[800px] flex gap-1 items-start">
        <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-medium pr-2 mt-4">
          <div className="h-3"></div>
          <div className="h-3 leading-3">Mon</div>
          <div className="h-3"></div>
          <div className="h-3 leading-3">Wed</div>
          <div className="h-3"></div>
          <div className="h-3 leading-3">Fri</div>
          <div className="h-3"></div>
        </div>
        
        {weeks.map((week, i) => {
          // Check if it's the first week of a month to show label
          const firstDay = week[0];
          const isFirstWeekOfMonth = firstDay && firstDay.date.getDate() <= 7; 
          
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="h-4 text-[10px] text-slate-400 font-medium mb-1">
                {isFirstWeekOfMonth ? monthNames[firstDay.date.getMonth()] : ''}
              </div>
              {week.map(day => (
                <div 
                  key={day.dateStr}
                  title={`${day.dateStr}: ${day.count} activities`}
                  className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-colors hover:ring-2 hover:ring-slate-400 cursor-pointer`}
                />
              ))}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-slate-500 font-medium justify-end">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-slate-100" />
        <div className="w-3 h-3 rounded-sm bg-indigo-200" />
        <div className="w-3 h-3 rounded-sm bg-indigo-400" />
        <div className="w-3 h-3 rounded-sm bg-indigo-600" />
        <span>More</span>
      </div>
    </div>
  );
}
