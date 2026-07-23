'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { calculateMonthlyStats, formatCurrency } from '@/lib/finance';
import { Transaction } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function MonthlyPlanner({ transactions }: { transactions: Transaction[] }) {
  const { income, expenses, savingsRate } = calculateMonthlyStats(transactions);
  
  const data = [
    { name: 'Expenses', value: expenses, color: '#f43f5e' }, // rose-500
    { name: 'Saved', value: Math.max(0, income - expenses), color: '#10b981' }, // emerald-500
  ];

  return (
    <Card className="border-zinc-100">
      <CardHeader>
        <CardTitle>This Month</CardTitle>
        <CardDescription>Income vs Expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Income</span>
            <span className="font-medium text-zinc-900">{formatCurrency(income)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Expenses</span>
            <span className="font-medium text-rose-600">{formatCurrency(expenses)}</span>
          </div>
          <div className="h-px bg-zinc-100 w-full my-2" />
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Net Saved</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(Math.max(0, income - expenses))}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
