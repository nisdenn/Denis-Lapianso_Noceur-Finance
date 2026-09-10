import { createClient } from '@/utils/supabase/server';
import { Transaction, Account, BudgetBucket, Goal, Category } from './types';
import { financeService } from '@/lib/services/finance.service';
import { unstable_noStore as noStore } from 'next/cache';

export async function getCurrentUserId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user.id;
}

export async function getCategories(): Promise<Category[]> {
  noStore();
  try {
    const userId = await getCurrentUserId();
    return await financeService.getCategories(userId);
  } catch {
    return [];
  }
}

export async function getWallets(): Promise<Account[]> {
  noStore();
  try {
    const userId = await getCurrentUserId();
    return await financeService.getWallets(userId);
  } catch {
    return [];
  }
}

export async function addWallet(name: string): Promise<string> {
  const userId = await getCurrentUserId();
  return await financeService.addWallet(userId, name);
}

export async function deleteWallet(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  return await financeService.deleteWallet(userId, id);
}

export async function updateAccountBalance(accountId: string, newBalance: number): Promise<void> {
  const userId = await getCurrentUserId();
  return await financeService.adjustWalletBalance(userId, accountId, newBalance);
}

export async function getTransactions(): Promise<Transaction[]> {
  noStore();
  try {
    const userId = await getCurrentUserId();
    return await financeService.getTransactions(userId);
  } catch {
    return [];
  }
}

export async function addTransaction(data: any): Promise<string> {
  const userId = await getCurrentUserId();
  return await financeService.createTransaction(userId, {
    date: data.date,
    description: data.description,
    type: data.type,
    category: data.category,
    categoryId: data.categoryId || null,
    fromAccountId: data.fromAccountId || null,
    toAccountId: data.toAccountId || null,
    amount: data.amount,
  });
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  await financeService.deleteTransaction(userId, id);
  return true;
}

export async function getBudgets(): Promise<BudgetBucket[]> {
  noStore();
  try {
    const userId = await getCurrentUserId();
    return await financeService.getBudgets(userId);
  } catch {
    return [];
  }
}

export async function addBudget(name: string, targetAmount: number): Promise<string> {
  const userId = await getCurrentUserId();
  return await financeService.addBudget(userId, name, targetAmount);
}

export async function deleteBudget(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  return await financeService.deleteBudget(userId, id);
}

export async function linkBudgetWallet(id: string, walletId: string | null): Promise<void> {
  const userId = await getCurrentUserId();
  return await financeService.linkBudgetWallet(userId, id, walletId);
}

export async function getGoals(): Promise<Goal[]> {
  noStore();
  try {
    const userId = await getCurrentUserId();
    return await financeService.getGoals(userId);
  } catch {
    return [];
  }
}

export async function addGoal(name: string, targetAmount: number): Promise<string> {
  const userId = await getCurrentUserId();
  return await financeService.addGoal(userId, name, targetAmount);
}

export async function deleteGoal(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  return await financeService.deleteGoal(userId, id);
}

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
    (data || []).forEach(row => settingsMap.set(row.key, row.value));

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
  } catch {
    return { userName: 'User', profileImageUrl: 'https://i.pravatar.cc/150?img=11', backgroundImageUrl: '', reminderEmail: '' };
  }
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  
  const { error } = await supabase
    .from('settings')
    .upsert([{ user_id: userId, key, value }], { onConflict: 'user_id,key' });
  if (error) throw error;
}

export async function getDueReminders(): Promise<any[]> {
  noStore();
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_active', true);
      
    if (error || !data) return [];

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentDay = now.getDay(); 
    
    return data.filter(reminder => {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      const isPastTime = currentHours > hours || (currentHours === hours && currentMinutes >= minutes);
      
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
  } catch {
    return [];
  }
}
