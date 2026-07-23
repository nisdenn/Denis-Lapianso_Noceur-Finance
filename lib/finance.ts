import { Account, BudgetBucket, Transaction } from './types';

export function calculateTotalAssets(accounts: Account[]) {
  return accounts.reduce((sum, acc) => sum + acc.balance, 0);
}

export function calculateTotalSavings(budgets: BudgetBucket[]) {
  return budgets.reduce((sum, b) => sum + b.currentAmount, 0);
}

export function calculateAvailableMoney(totalAssets: number, totalSavings: number) {
  return totalAssets - totalSavings;
}

export function calculateMonthlyStats(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let income = 0;
  let expenses = 0;
  transactions.forEach((tx) => {
    let txDate: Date;
    if (tx.date) {
      if (tx.date.includes('/')) {
        const parts = tx.date.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY
          txDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          txDate = new Date(tx.date);
        }
      } else if (tx.date.includes('-')) {
        const parts = tx.date.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            txDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            // DD-MM-YYYY
            txDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        } else {
          txDate = new Date(tx.date);
        }
      } else {
        txDate = new Date(tx.date);
      }
    } else {
      return;
    }
    
    if (txDate && !isNaN(txDate.getTime())) {
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        const type = (tx.type || '').toLowerCase();
        if (type === 'income') income += tx.amount;
        if (type === 'expense') expenses += tx.amount;
      }
    }
  });
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  return { income, expenses, savingsRate };
}

export function calculateHealthScore(
  savingsRate: number,
  expenses: number,
  income: number,
  availableMoney: number,
  totalAssets: number
): number {
  let score = 50;
  if (savingsRate > 20) score += 30;
  else if (savingsRate > 10) score += 20;
  else if (savingsRate > 0) score += 10;
  else if (savingsRate < 0) score -= 20;
  
  const expenseRatio = income > 0 ? expenses / income : 1;
  if (expenseRatio < 0.5) score += 20;
  else if (expenseRatio < 0.8) score += 10;
  else if (expenseRatio > 1) score -= 20;
  
  const liquidity = totalAssets > 0 ? availableMoney / totalAssets : 0;
  if (liquidity >= 0.1 && liquidity <= 0.3) score += 10;
  else if (liquidity < 0.05) score -= 10;
  return Math.max(0, Math.min(100, score));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
