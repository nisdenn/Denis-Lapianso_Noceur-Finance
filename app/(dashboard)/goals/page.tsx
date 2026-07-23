export const dynamic = "force-dynamic";
import { getGoals } from '@/lib/db';
import { formatCurrency } from '@/lib/finance';
import AddGoalForm from '@/components/AddGoalForm';
import DeleteGoalButton from '@/components/DeleteGoalButton';

export const revalidate = 0;

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Goals</h1>
        <p className="text-xs text-slate-500 mt-1">Track your long-term financial goals.</p>
      </div>

      <div className="max-w-md">
        <AddGoalForm />
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm overflow-y-auto">
        {goals.length === 0 ? (
          <div className="flex h-full justify-center items-center text-slate-400">
            <p className="font-bold">No goals found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((g, i) => {
              const perc = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              const colors = [
                'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500'
              ];
              const color = colors[i % colors.length];

              return (
                <div key={g.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">{g.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                        {perc.toFixed(0)}%
                      </span>
                      <DeleteGoalButton id={g.id} name={g.name} />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Saved</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(g.currentAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Target</span>
                      <span className="font-bold text-slate-700">{formatCurrency(g.targetAmount)}</span>
                    </div>
                  </div>

                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, perc)}%` }}></div>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 mt-3 text-center">
                    {g.targetAmount - g.currentAmount > 0 
                      ? `${formatCurrency(g.targetAmount - g.currentAmount)} more to go!`
                      : 'Goal reached! 🎉'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
