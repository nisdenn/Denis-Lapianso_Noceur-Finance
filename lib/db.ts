import { createClient } from '@/utils/supabase/server';
import { Transaction, Account, BudgetBucket, Goal, Category } from './types';
import { unstable_noStore as noStore } from 'next/cache';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user.id;
}

// ------------------------------------------------------------------
// CATEGORIES
// ------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  noStore();
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      type: r.type
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

// ------------------------------------------------------------------
// WALLETS
// ------------------------------------------------------------------

export async function getWallets(): Promise<Account[]> {
  noStore();
  try {
    const supabase = createClient();
    // Query the wallet_balances view which handles ledger logic securely via RLS
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(r => ({
      id: r.wallet_id,
      name: r.name,
      balance: Number(r.balance)
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function addWallet(name: string): Promise<string> {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('wallets').insert([{ user_id: userId, name }]).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function deleteWallet(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('wallets').delete().eq('id', id);
  if (error) throw error;
}

export async function updateAccountBalance(accountId: string, newBalance: number) {
  // Balance is now computed via Ledger (wallet_balances view). 
  // We cannot "update" the balance directly anymore. 
  // If the user wants to adjust balance, they should insert an adjustment transaction.
  // For compatibility with any old UI logic, we throw or do an adjustment:
  throw new Error("Direct balance updates are disabled in Ledger mode. Please add an adjustment transaction.");
}

// ------------------------------------------------------------------
// TRANSACTIONS
// ------------------------------------------------------------------

export async function getTransactions(): Promise<Transaction[]> {
  noStore();
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id, date, description, amount, type,
        category_id, from_wallet_id, to_wallet_id,
        categories ( id, name ),
        from_wallet:wallets!from_wallet_id ( id, name ),
        to_wallet:wallets!to_wallet_id ( id, name )
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      type: r.type,
      category: r.categories?.name || 'Unknown',
      categoryId: r.category_id || '',
      fromAccount: r.from_wallet?.name || '-',
      fromAccountId: r.from_wallet_id || '',
      toAccount: r.to_wallet?.name || '-',
      toAccountId: r.to_wallet_id || '',
      amount: Number(r.amount)
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function addTransaction(data: any) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  
  let type = 'Expense';
  if (data.category === 'Income') type = 'Income';
  if (data.category === 'Transfer' || data.category === 'Transaction') type = 'Transfer';

  const { error } = await supabase.from('transactions').insert([{
    user_id: userId,
    date: data.date,
    description: data.description,
    type: type,
    category_id: data.categoryId || null,
    from_wallet_id: data.fromAccountId || null,
    to_wallet_id: data.toAccountId || null,
    amount: data.amount
  }]);
  if (error) throw error;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ------------------------------------------------------------------
// BUDGETS
// ------------------------------------------------------------------

export async function getBudgets(): Promise<BudgetBucket[]> {
  noStore();
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('budgets').select('*, wallets(id, name)').order('created_at', { ascending: true });
    if (error) throw error;

    const wallets = await getWallets();

    return (data || []).map((r: any) => {
      const linkedWallet = wallets.find(w => w.id === r.wallet_id);
      return {
        id: r.id,
        name: r.name,
        targetAmount: Number(r.target_amount),
        currentAmount: linkedWallet ? linkedWallet.balance : 0,
        walletName: r.wallets?.name || '',
        walletId: r.wallet_id || ''
      };
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function addBudget(name: string, targetAmount: number) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase.from('budgets').insert([{ user_id: userId, name, target_amount: targetAmount }]);
  if (error) throw error;
}

export async function deleteBudget(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

export async function linkBudgetWallet(id: string, walletId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('budgets').update({ wallet_id: walletId }).eq('id', id);
  if (error) throw error;
}

// ------------------------------------------------------------------
// GOALS
// ------------------------------------------------------------------

export async function getGoals(): Promise<Goal[]> {
  noStore();
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
    if (error) throw error;

    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      targetAmount: Number(r.target_amount),
      currentAmount: Number(r.current_amount)
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function addGoal(name: string, targetAmount: number) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase.from('goals').insert([{ user_id: userId, name, target_amount: targetAmount, current_amount: 0 }]);
  if (error) throw error;
}

export async function deleteGoal(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// ------------------------------------------------------------------
// SETTINGS
// ------------------------------------------------------------------

export type AppSettings = {
  userName: string;
  profileImageUrl: string;
  backgroundImageUrl: string;
  reminderEmail: string;
};

export async function getSettings(): Promise<AppSettings> {
  noStore();
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;

    const settingsMap = new Map<string, string>();
    (data || []).forEach(r => settingsMap.set(r.key, r.value));

    // Get username from profiles table if not in settings
    if (!settingsMap.has('userName')) {
        const { data: user } = await supabase.from('profiles').select('username').single();
        if (user) {
            settingsMap.set('userName', user.username);
        }
    }

    return {
      userName: settingsMap.get('userName') || 'User',
      profileImageUrl: settingsMap.get('profileImageUrl') || 'https://i.pravatar.cc/150?img=11',
      backgroundImageUrl: settingsMap.get('backgroundImageUrl') || '',
      reminderEmail: settingsMap.get('reminderEmail') || ''
    };
  } catch (e) {
    console.error(e);
    return { userName: 'User', profileImageUrl: 'https://i.pravatar.cc/150?img=11', backgroundImageUrl: '', reminderEmail: '' };
  }
}

export async function updateSetting(key: string, value: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  
  // Upsert
  const { error } = await supabase.from('settings').upsert([{ user_id: userId, key, value }], { onConflict: 'user_id,key' });
  if (error) throw error;
}

// ------------------------------------------------------------------
// REMINDERS
// ------------------------------------------------------------------

export async function getDueReminders(): Promise<any[]> {
  noStore();
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_active', true);
      
    if (error) throw error;
    if (!data) return [];

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentDay = now.getDay(); 
    
    return data.filter(reminder => {
      const [rHours, rMinutes] = reminder.time.split(':').map(Number);
      const isPastTime = currentHours > rHours || (currentHours === rHours && currentMinutes >= rMinutes);
      
      if (!isPastTime) return false;

      if (reminder.frequency === 'weekly' && reminder.day_of_week !== currentDay) {
        return false;
      }
      
      if (reminder.last_completed_at) {
        const lastCompleted = new Date(reminder.last_completed_at);
        if (
          lastCompleted.getFullYear() === now.getFullYear() &&
          lastCompleted.getMonth() === now.getMonth() &&
          lastCompleted.getDate() === now.getDate()
        ) {
          return false; 
        }
      }
      
      return true;
    });

  } catch (e) {
    console.error(e);
    return [];
  }
}
