import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  highlight?: boolean;
}

export function StatCard({ title, value, icon: Icon, description, trend, highlight }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 border-zinc-100", highlight ? "bg-zinc-950 text-white border-zinc-900" : "bg-white")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={cn("text-sm font-medium", highlight ? "text-zinc-400" : "text-zinc-500")}>
          {title}
        </CardTitle>
        {Icon && <Icon className={cn("h-4 w-4", highlight ? "text-zinc-400" : "text-zinc-400")} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display tracking-tight">{value}</div>
        {description && (
          <p className={cn("text-xs mt-1", highlight ? "text-zinc-400" : "text-zinc-500")}>
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                "text-xs font-medium",
                trend.value >= 0 ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
            <span className={cn("text-xs", highlight ? "text-zinc-500" : "text-zinc-400")}>{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
