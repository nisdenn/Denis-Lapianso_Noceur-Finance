import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/finance';

interface AccountCardProps {
  name: string;
  balance: number;
  percentage: number;
}

export function AccountCard({ name, balance, percentage }: AccountCardProps) {
  // Simple aesthetic colors based on names
  let gradient = "from-blue-500/10 to-blue-500/5";
  let textColor = "text-blue-600";
  
  if (name.toLowerCase().includes('bca')) {
    gradient = "from-blue-600/10 to-blue-600/5";
    textColor = "text-blue-700";
  } else if (name.toLowerCase().includes('jago')) {
    gradient = "from-orange-500/10 to-orange-500/5";
    textColor = "text-orange-600";
  } else if (name.toLowerCase().includes('sea')) {
    gradient = "from-teal-500/10 to-teal-500/5";
    textColor = "text-teal-600";
  } else if (name.toLowerCase().includes('cash')) {
    gradient = "from-emerald-500/10 to-emerald-500/5";
    textColor = "text-emerald-600";
  }

  return (
    <Card className="overflow-hidden border-zinc-100 hover:shadow-md transition-shadow duration-200">
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient.replace('/10', '/80').replace('/5', '/40')}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold font-display tracking-tight">{formatCurrency(balance)}</div>
        <div className="mt-2 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${gradient.replace('/10', '/80').replace('/5', '/40')}`}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
        <div className="text-xs text-zinc-400 mt-1.5 text-right font-medium">{percentage.toFixed(1)}% of total</div>
      </CardContent>
    </Card>
  );
}
