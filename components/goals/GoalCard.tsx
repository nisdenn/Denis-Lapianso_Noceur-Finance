import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/finance';
import { Goal } from '@/lib/types';
import { Target } from 'lucide-react';

export function GoalCard({ goal }: { goal: Goal }) {
  const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const isCompleted = percentage >= 100;
  
  return (
    <Card className={`overflow-hidden border-zinc-100 transition-all duration-300 relative ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white hover:shadow-md'}`}>
      {isCompleted && (
        <div className="absolute top-0 right-0 p-4">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Target className={`w-4 h-4 ${isCompleted ? 'text-emerald-500' : 'text-zinc-400'}`} />
          <CardTitle className="text-lg">{goal.name}</CardTitle>
        </div>
        <CardDescription>Target: {formatCurrency(goal.targetAmount)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-2 mt-4">
          <div className="text-2xl font-bold font-display">{formatCurrency(goal.currentAmount)}</div>
          <div className={`text-sm font-medium px-2 py-0.5 rounded-full ${isCompleted ? 'text-emerald-700 bg-emerald-100' : 'text-blue-600 bg-blue-50'}`}>
            {percentage.toFixed(1)}%
          </div>
        </div>
        <Progress value={percentage} className={`h-2 ${isCompleted ? '[&>div]:bg-emerald-500' : ''}`} />
        
        {isCompleted ? (
          <p className="text-xs text-emerald-600 mt-3 font-medium text-center">
            Goal achieved! 🎉
          </p>
        ) : (
          <p className="text-xs text-zinc-500 mt-3 text-right">
            {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))} to go
          </p>
        )}
      </CardContent>
    </Card>
  );
}
