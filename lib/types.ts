export type Category = {
  id: string;
  name: string;
  type: string;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: string; // 'Income', 'Expense', 'Transfer'
  category: string;
  categoryId: string; // UUID
  fromAccount: string; // Name
  fromAccountId: string; // UUID
  toAccount: string; // Name
  toAccountId: string; // UUID
  amount: number;
};

export type Account = {
  id: string; // UUID
  name: string;
  balance: number;
};

export type BudgetBucket = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  walletName?: string;
  walletId?: string; // UUID
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
};
