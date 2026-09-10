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
  await requireAuth();

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid transaction ID.');
  }

  await deleteTransaction(id.trim());
  await getWallets();
  revalidatePath('/', 'layout');
}

export async function submitWallet(formData: FormData) {
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
  await requireAuth();

  const raw = {
    id: (formData.get('id') as string) || undefined,
    name: (formData.get('name') as string) || undefined,
    balance: safeParseFloat(formData.get('balance') as string) || 0,
  };

  const result = WalletBalanceSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(zodErrors(result.error));
  }

  const { id, name, balance: newBalance } = result.data;
  const wallets = await getWallets();
  let wallet = id ? wallets.find(w => w.id === id) : null;
  if (!wallet && name) {
    wallet = wallets.find(w => w.name.toLowerCase() === name.toLowerCase());
  }

  if (wallet) {
    await updateAccountBalance(wallet.id, newBalance);
  }

  revalidatePath('/', 'layout');
}

export async function removeWalletAction(idOrName: string) {
  await requireAuth();

  if (!idOrName || typeof idOrName !== 'string' || idOrName.trim() === '') {
    throw new Error('Invalid wallet identifier.');
  }

  try {
    const trimmed = idOrName.trim();
    const wallets = await getWallets();
    const wallet = wallets.find(w => w.id === trimmed || w.name.toLowerCase() === trimmed.toLowerCase());
    if (wallet) {
      await deleteWallet(wallet.id);
    }
  } catch (error) {
    console.error('removeWalletAction error:', error);
  }
  revalidatePath('/', 'layout');
}

export async function submitBudget(formData: FormData) {
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
  await requireAuth();

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid budget ID.');
  }

  try {
    await deleteBudget(id.trim());
  } catch (error) {
    console.error('removeBudgetAction error:', error);
  }
  revalidatePath('/', 'layout');
}

export async function linkBudgetWalletAction(id: string, walletIdOrName: string) {
  await requireAuth();

  if (!id) {
    throw new Error('Invalid budget reference.');
  }

  try {
    if (!walletIdOrName) {
      await linkBudgetWallet(id.trim(), null);
    } else {
      const trimmed = walletIdOrName.trim();
      const wallets = await getWallets();
      const wallet = wallets.find(w => w.id === trimmed || w.name.toLowerCase() === trimmed.toLowerCase());
      await linkBudgetWallet(id.trim(), wallet ? wallet.id : null);
    }
  } catch (error) {
    console.error('linkBudgetWalletAction error:', error);
  }
  revalidatePath('/', 'layout');
}

export async function submitGoal(formData: FormData) {
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
  await requireAuth();

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid goal ID.');
  }

  try {
    await deleteGoal(id.trim());
  } catch (error) {
    console.error('removeGoalAction error:', error);
  }
  revalidatePath('/', 'layout');
}
