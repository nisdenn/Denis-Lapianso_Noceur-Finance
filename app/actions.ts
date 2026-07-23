'use server';

import { revalidatePath } from 'next/cache';
import {
  addTransaction,
  updateAccountBalance,
  getWallets,
  deleteTransaction,
  addBudget,
  addGoal,
  addWallet,
  deleteWallet,
  deleteBudget,
  linkBudgetWallet,
  updateSetting,
  deleteGoal
} from '@/lib/db';
import { Transaction } from '@/lib/types';
import { requireAuth } from '@/lib/auth-guard';
import {
  TransactionSchema,
  WalletSchema,
  WalletBalanceSchema,
  BudgetSchema,
  GoalSchema,
  SettingsSchema,
  safeParseFloat,
  zodErrors,
} from '@/lib/validation';

export async function saveSettingsAction(formData: FormData) {
  // Auth check — must be logged in
  await requireAuth();

  const raw = {
    userName: (formData.get('userName') as string) ?? undefined,
    profileImageUrl: (formData.get('profileImageUrl') as string) ?? undefined,
    backgroundImageUrl: (formData.get('backgroundImageUrl') as string) ?? undefined,
  };

  const result = SettingsSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(zodErrors(result.error));
  }

  const { userName, profileImageUrl, backgroundImageUrl } = result.data;
  if (userName !== undefined) await updateSetting('userName', userName);
  if (profileImageUrl !== undefined) await updateSetting('profileImageUrl', profileImageUrl);
  if (backgroundImageUrl !== undefined) await updateSetting('backgroundImageUrl', backgroundImageUrl);

  revalidatePath('/settings');
  revalidatePath('/', 'layout');
}

export async function submitTransaction(formData: FormData) {
  // Auth check — must be logged in
  await requireAuth();

  const raw = {
    date: formData.get('date') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as Transaction['category'],
    fromAccountId: (formData.get('fromAccountId') as string) || '',
    toAccountId: (formData.get('toAccountId') as string) || '',
    amount: safeParseFloat(formData.get('amount') as string),
  };

  const result = TransactionSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(zodErrors(result.error));
  }

  await addTransaction(result.data);
  await getWallets();
  revalidatePath('/', 'layout');
}

export async function removeTransactionAction(id: string) {
  // Auth check — must be logged in
  await requireAuth();

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid transaction ID.');
  }

  try {
    await deleteTransaction(id.trim());
    await getWallets();
    revalidatePath('/', 'layout');
  } catch (e) {
    console.error('removeTransactionAction error:', e);
    throw e;
  }
}

export async function submitWallet(formData: FormData) {
  // Auth check — must be logged in
  await requireAuth();

  const raw = {
    name: formData.get('name') as string,
    initialBalance: safeParseFloat(formData.get('initialBalance') as string) || 0,
  };

  const result = WalletSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(zodErrors(result.error));
  }

  const { name, initialBalance } = result.data;

  const newWalletId = await addWallet(name);

  if (initialBalance > 0) {
    await addTransaction({
      date: new Date().toISOString().split('T')[0],
      description: 'Initial Balance',
      category: 'Income',
      fromAccountId: '',
      toAccountId: newWalletId,
      amount: initialBalance,
    });
  }

  await getWallets();
  revalidatePath('/', 'layout');
}

export async function editWalletBalanceAction(formData: FormData) {
  // Auth check — must be logged in
  await requireAuth();

  const raw = {
    name: formData.get('name') as string,
    balance: safeParseFloat(formData.get('balance') as string) || 0,
  };

  const result = WalletBalanceSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(zodErrors(result.error));
  }

  const { name, balance: newBalance } = result.data;

  const wallets = await getWallets();
  const wallet = wallets.find(w => w.name === name);
  if (wallet) {
    const difference = newBalance - wallet.balance;
    if (difference !== 0) {
      await addTransaction({
        date: new Date().toISOString().split('T')[0],
        description: 'Balance Adjustment',
        category: difference > 0 ? 'Income' : 'Expense',
        fromAccountId: difference > 0 ? '' : wallet.id,
        toAccountId: difference > 0 ? wallet.id : '',
        amount: Math.abs(difference),
      });
      await getWallets();
    }
  }

  revalidatePath('/', 'layout');
}

export async function removeWalletAction(name: string) {
  // Auth check — must be logged in
  await requireAuth();

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Invalid wallet name.');
  }

  try {
    await deleteWallet(name.trim());
  } catch (e) {
    console.error('removeWalletAction error:', e);
  }
  revalidatePath('/', 'layout');
}

export async function submitBudget(formData: FormData) {
  // Auth check — must be logged in
  await requireAuth();

  const raw = {
    name: formData.get('name') as string,
    targetAmount: safeParseFloat(formData.get('targetAmount') as string),
  };

  const result = BudgetSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(zodErrors(result.error));
  }

  await addBudget(result.data.name, result.data.targetAmount);
  revalidatePath('/', 'layout');
}

export async function removeBudgetAction(id: string) {
  // Auth check — must be logged in
  await requireAuth();

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid budget ID.');
  }

  try {
    await deleteBudget(id.trim());
  } catch (e) {
    console.error('removeBudgetAction error:', e);
  }
  revalidatePath('/', 'layout');
}

export async function linkBudgetWalletAction(id: string, walletName: string) {
  // Auth check — must be logged in
  await requireAuth();

  if (!id || !walletName) {
    throw new Error('Invalid budget or wallet reference.');
  }

  try {
    await linkBudgetWallet(id.trim(), walletName.trim());
  } catch (e) {
    console.error('linkBudgetWalletAction error:', e);
  }
  revalidatePath('/', 'layout');
}

export async function submitGoal(formData: FormData) {
  // Auth check — must be logged in
  await requireAuth();

  const raw = {
    name: formData.get('name') as string,
    targetAmount: safeParseFloat(formData.get('targetAmount') as string),
  };

  const result = GoalSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(zodErrors(result.error));
  }

  await addGoal(result.data.name, result.data.targetAmount);
  revalidatePath('/', 'layout');
}

export async function removeGoalAction(id: string) {
  // Auth check — must be logged in
  await requireAuth();

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid goal ID.');
  }

  try {
    await deleteGoal(id.trim());
  } catch (e) {
    console.error('removeGoalAction error:', e);
  }
  revalidatePath('/', 'layout');
}
