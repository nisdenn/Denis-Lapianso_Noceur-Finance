import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/finance';
import { BudgetBucket } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function BudgetCard({ budget }: { budget: BudgetBucket }) {
  const percentage = budget.targetAmount > 0 ? (budget.currentAmount / budget.targetAmount) * 100 : 0;
  
  return (
    <Card className="overflow-hidden border-zinc-100 hover:shadow-md transition-all duration-200 group">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{budget.name}</CardTitle>
        <CardDescription>Target: {formatCurrency(budget.targetAmount)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-2">
          <div className="text-2xl font-bold font-display">{formatCurrency(budget.currentAmount)}</div>
          <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {percentage.toFixed(1)}%
          </div>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-zinc-500 mt-3 text-right">
          {formatCurrency(Math.max(0, budget.targetAmount - budget.currentAmount))} remaining
        </p>
      </CardContent>
    </Card>
  );
}
