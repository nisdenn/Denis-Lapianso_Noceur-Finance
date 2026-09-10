export const dynamic = "force-dynamic";
import { getWallets, getBudgets, getTransactions, getSettings } from '@/lib/db';
import { calculateTotalAssets, calculateTotalSavings, calculateAvailableMoney, calculateMonthlyStats, calculateHealthScore, formatCurrency } from '@/lib/finance';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, AlertCircle } from 'lucide-react';
import AddTransactionForm from '@/components/AddTransactionForm';
import DeleteTransactionButton from '@/components/DeleteTransactionButton';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

import AnalyticsChart from '@/components/AnalyticsChart';
import InAppReminders from '@/components/InAppReminders';
import { getDueReminders } from '@/lib/db';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const accounts = await getWallets();
  const budgets = await getBudgets();
  const transactions = await getTransactions();
  const settings = await getSettings();
  const dueReminders = await getDueReminders();

  const totalAssets = calculateTotalAssets(accounts);
  const totalSavings = calculateTotalSavings(budgets);
  const availableMoney = calculateAvailableMoney(totalAssets, totalSavings);
  const { income, expenses, savingsRate } = calculateMonthlyStats(transactions);
  const healthScore = calculateHealthScore(savingsRate, expenses, income, availableMoney, totalAssets);
  
  const savings = Math.max(0, income - expenses);

  const chartData = [
    { name: 'INC', amount: income, color: '#10b981' },
    { name: 'EXP', amount: expenses, color: '#f43f5e' },
    { name: 'SAV', amount: savings, color: '#6366f1' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full h-full">

      <InAppReminders dueReminders={dueReminders} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-lg shadow-slate-200/50 flex flex-col justify-between min-h-[12rem]">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Total Balance</p>
              <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(totalAssets)}</h2>
            </div>
            <div className="flex gap-4 mt-6">
              <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Monthly Expenses</p>
                <p className="text-sm font-bold text-rose-500">{formatCurrency(expenses)}</p>
              </div>
              <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Health Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-emerald-600">{healthScore}/100</p>
                  <div className="h-1.5 flex-1 bg-slate-200 rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${healthScore}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white/60 backdrop-blur-md border border-white/40 p-5 rounded-3xl flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Wallets</h3>
            
            {accounts.map(acc => {
              const percentage = totalAssets > 0 ? (acc.balance / totalAssets) * 100 : 0;
              let bgClass = "bg-white text-slate-900 border-white/60";
              let labelOpacity = "opacity-60 text-slate-500";
              let badgeBg = "bg-slate-100";
              
              if (acc.name.toLowerCase().includes('bca')) {
                bgClass = "bg-[#005596] text-white border-transparent";
                badgeBg = "bg-white/10";
                labelOpacity = "opacity-80 text-blue-100";
              } else if (acc.name.toLowerCase().includes('jago')) {
                bgClass = "bg-[#FFCC00] text-slate-900 border-transparent";
                badgeBg = "bg-white/40";
                labelOpacity = "opacity-70 text-amber-900";
              } else if (acc.name.toLowerCase().includes('sea')) {
                bgClass = "bg-[#FF5722] text-white border-transparent";
                badgeBg = "bg-white/20";
                labelOpacity = "opacity-80 text-orange-100";
              } else if (acc.name.toLowerCase().includes('cash')) {
                bgClass = "bg-emerald-600 text-white border-transparent";
                badgeBg = "bg-white/20";
                labelOpacity = "opacity-80 text-emerald-100";
              }

              return (
                <div key={acc.name} className={`p-3 rounded-2xl shadow-sm flex justify-between items-center ${bgClass}`}>
                  <div>
                    <p className={`text-[10px] font-bold uppercase ${labelOpacity}`}>{acc.name}</p>
                    <p className="font-bold">{formatCurrency(acc.balance)}</p>
                  </div>
                  <div className={`text-right text-[10px] font-bold px-2 py-1 rounded-lg ${badgeBg}`}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              );
            })}
            
            {accounts.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400">No accounts found. Add one below.</div>
            )}
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-56">
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-sm flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Monthly Planner</h3>
              <div className="flex-1 flex gap-2 items-end justify-between px-2">
                <div className="w-2/3 h-full pb-4">
                  <AnalyticsChart data={chartData} />
                </div>
                <div className="flex-1 pl-4 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Savings Rate</p>
                    <p className="text-2xl font-bold text-slate-800">{savingsRate.toFixed(1)}%</p>
                    <p className="text-[10px] text-emerald-600 font-bold">This month</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-sm flex flex-col justify-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Cash Flow</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Income</p>
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(income)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Expenses</p>
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(expenses)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-500">Net Flow</p>
                  <p className={`text-sm font-bold ${income - expenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {income - expenses >= 0 ? '+' : ''}{formatCurrency(income - expenses)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[16rem]">
            <div className="p-5 border-b border-white flex justify-between items-center bg-white/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction Center</h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Synced to Cloud</span>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 border-r border-slate-100 flex flex-col gap-3">
                <AddTransactionForm wallets={accounts} />
              </div>

              <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[16rem] md:max-h-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Recently Added</p>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map(tx => {
                    const type = (tx.type || '').toLowerCase();
                    const isIncome = type === 'income';
                    const isExpense = type === 'expense';
                    const isTransfer = type === 'transfer';
                    
                    let accountDisplay = tx.fromAccount || tx.toAccount;
                    if (isTransfer) {
                      accountDisplay = `${tx.fromAccount !== '-' ? tx.fromAccount : '?'} → ${tx.toAccount !== '-' ? tx.toAccount : '?'}`;
                    } else if (isIncome) {
                      accountDisplay = tx.toAccount !== '-' ? tx.toAccount : 'Income';
                    } else if (isExpense) {
                      accountDisplay = tx.fromAccount !== '-' ? tx.fromAccount : 'Expense';
                    }

                    return (
                      <div key={tx.id} className="flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome ? 'bg-emerald-100 text-emerald-600' :
                            isExpense ? 'bg-rose-100 text-rose-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {isIncome && <ArrowDownLeft className="w-4 h-4" />}
                            {isExpense && <ArrowUpRight className="w-4 h-4" />}
                            {isTransfer && <ArrowRightLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold truncate max-w-[120px]">{tx.description}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {accountDisplay} &bull; {tx.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className={`text-xs font-bold whitespace-nowrap ${
                            isIncome ? 'text-emerald-600' :
                            isExpense ? 'text-rose-600' :
                            'text-slate-500'
                          }`}>
                            {isIncome ? '+ ' : isExpense ? '- ' : ''}{formatCurrency(tx.amount)}
                          </p>
                          <DeleteTransactionButton id={tx.id} />
                        </div>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <div className="text-xs text-slate-400 text-center mt-4">No recent transactions</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
