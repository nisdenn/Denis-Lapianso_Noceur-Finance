import { supabase as adminClient } from '@/lib/supabase';
import { Account, BudgetBucket, Category, Goal, Transaction } from '@/lib/types';
import { SupabaseClient } from '@supabase/supabase-js';

export type CreateTransactionInput = {
  date: string;
  description: string;
  type?: 'Income' | 'Expense' | 'Transfer';
  category?: string;
  categoryId?: string | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  amount: number;
};

export class FinanceService {
  private client: SupabaseClient;

  constructor(customClient?: SupabaseClient) {
    this.client = customClient || adminClient;
  }

  async getWallets(userId: string): Promise<Account[]> {
    const { data, error } = await this.client
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) return [];

    return (data || []).map(row => ({
      id: row.wallet_id,
      name: row.name,
      balance: Number(row.balance) || 0,
    }));
  }

  async getWalletById(userId: string, walletId: string): Promise<Account | null> {
    const { data, error } = await this.client
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_id', walletId)
      .single();

    if (error || !data) return null;
    return {
      id: data.wallet_id,
      name: data.name,
      balance: Number(data.balance) || 0,
    };
  }

  async findWalletByName(userId: string, name: string): Promise<Account | null> {
    const trimmed = name.trim().toLowerCase();
    const wallets = await this.getWallets(userId);
    return wallets.find(w => w.name.toLowerCase() === trimmed) || null;
  }

  async addWallet(userId: string, name: string): Promise<string> {
    const { data, error } = await this.client
      .from('wallets')
      .insert([{ user_id: userId, name: name.trim() }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async deleteWallet(userId: string, walletId: string): Promise<void> {
    const { error } = await this.client
      .from('wallets')
      .delete()
      .eq('id', walletId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async adjustWalletBalance(userId: string, walletId: string, newBalance: number): Promise<void> {
    const wallet = await this.getWalletById(userId, walletId);
    if (!wallet) throw new Error('Wallet not found');

    const difference = newBalance - wallet.balance;
    if (difference === 0) return;

    await this.createTransaction(userId, {
      date: new Date().toISOString().split('T')[0],
      description: 'Balance Adjustment',
      type: difference > 0 ? 'Income' : 'Expense',
      fromAccountId: difference > 0 ? null : wallet.id,
      toAccountId: difference > 0 ? wallet.id : null,
      amount: Math.abs(difference),
    });
  }

  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) return [];

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
    }));
  }

  async findCategoryByName(userId: string, name: string, type?: string): Promise<Category | null> {
    const trimmed = name.trim().toLowerCase();
    const categories = await this.getCategories(userId);
    return categories.find(c => {
      const matchName = c.name.toLowerCase() === trimmed;
      if (type) {
        return matchName && c.type.toLowerCase() === type.toLowerCase();
      }
      return matchName;
    }) || null;
  }

  async getTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    let query = this.client
      .from('transactions')
      .select(`
        id, date, description, amount, type,
        category_id, from_wallet_id, to_wallet_id,
        categories ( id, name ),
        from_wallet:wallets!from_wallet_id ( id, name ),
        to_wallet:wallets!to_wallet_id ( id, name )
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) return [];

    return (data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      description: row.description,
      type: row.type,
      category: row.categories?.name || 'General',
      categoryId: row.category_id || '',
      fromAccount: row.from_wallet?.name || '-',
      fromAccountId: row.from_wallet_id || '',
      toAccount: row.to_wallet?.name || '-',
      toAccountId: row.to_wallet_id || '',
      amount: Number(row.amount) || 0,
    }));
  }

  async createTransaction(userId: string, input: CreateTransactionInput): Promise<string> {
    let resolvedType: 'Income' | 'Expense' | 'Transfer' = input.type || 'Expense';
    if (input.category === 'Income') resolvedType = 'Income';
    if (input.category === 'Transfer' || input.category === 'Transaction') resolvedType = 'Transfer';

    if (resolvedType === 'Income' && !input.toAccountId) {
      throw new Error('Income transaction requires a destination wallet');
    }
    if (resolvedType === 'Expense' && !input.fromAccountId) {
      throw new Error('Expense transaction requires a source wallet');
    }
    if (resolvedType === 'Transfer' && (!input.fromAccountId || !input.toAccountId)) {
      throw new Error('Transfer requires both fromAccountId and toAccountId');
    }

    const { data, error } = await this.client
      .from('transactions')
      .insert([{
        user_id: userId,
        date: input.date || new Date().toISOString().split('T')[0],
        description: input.description,
        type: resolvedType,
        category_id: input.categoryId || null,
        from_wallet_id: input.fromAccountId || null,
        to_wallet_id: input.toAccountId || null,
        amount: input.amount,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    const { error } = await this.client
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getBudgets(userId: string): Promise<BudgetBucket[]> {
    const { data, error } = await this.client
      .from('budgets')
      .select('*, wallets(id, name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) return [];

    const wallets = await this.getWallets(userId);

    return (data || []).map((row: any) => {
      const linkedWallet = wallets.find(w => w.id === row.wallet_id);
      return {
        id: row.id,
        name: row.name,
        targetAmount: Number(row.target_amount) || 0,
        currentAmount: linkedWallet ? linkedWallet.balance : 0,
        walletName: row.wallets?.name || '',
        walletId: row.wallet_id || '',
      };
    });
  }

  async addBudget(userId: string, name: string, targetAmount: number): Promise<string> {
    const { data, error } = await this.client
      .from('budgets')
      .insert([{ user_id: userId, name: name.trim(), target_amount: targetAmount }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const { error } = await this.client
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async linkBudgetWallet(userId: string, budgetId: string, walletId: string | null): Promise<void> {
    const { error } = await this.client
      .from('budgets')
      .update({ wallet_id: walletId || null })
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await this.client
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) return [];

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      targetAmount: Number(row.target_amount) || 0,
      currentAmount: Number(row.current_amount) || 0,
    }));
  }

  async addGoal(userId: string, name: string, targetAmount: number): Promise<string> {
    const { data, error } = await this.client
      .from('goals')
      .insert([{ user_id: userId, name: name.trim(), target_amount: targetAmount, current_amount: 0 }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const { error } = await this.client
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getBalanceSummary(userId: string): Promise<{
    totalAssets: number;
    accounts: Account[];
  }> {
    const accounts = await this.getWallets(userId);
    const totalAssets = accounts.reduce((sum, wallet) => sum + wallet.balance, 0);
    return {
      totalAssets,
      accounts,
    };
  }

  async getExpenseSummary(
    userId: string,
    month?: number,
    year?: number
  ): Promise<{
    monthName: string;
    year: number;
    totalIncome: number;
    totalExpense: number;
    savingsRate: number;
    topCategories: { name: string; amount: number }[];
  }> {
    const now = new Date();
    const targetMonth = month !== undefined ? month : now.getMonth();
    const targetYear = year !== undefined ? year : now.getFullYear();

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const transactions = await this.getTransactions(userId);
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = new Map<string, number>();

    for (const transaction of transactions) {
      if (!transaction.date) continue;
      const txDate = new Date(transaction.date);
      if (isNaN(txDate.getTime())) continue;

      if (txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear) {
        const type = (transaction.type || '').toLowerCase();
        if (type === 'income') {
          totalIncome += transaction.amount;
        } else if (type === 'expense') {
          totalExpense += transaction.amount;
          const categoryName = transaction.category || 'Uncategorized';
          categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + transaction.amount);
        }
      }
    }

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const topCategories = Array.from(categoryTotals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      monthName: monthNames[targetMonth],
      year: targetYear,
      totalIncome,
      totalExpense,
      savingsRate,
      topCategories,
    };
  }
}

export const financeService = new FinanceService();
