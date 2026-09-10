export type Category = {
  id: string;
  name: string;
  type: string;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: string;
  category: string;
  categoryId: string;
  fromAccount: string;
  fromAccountId: string;
  toAccount: string;
  toAccountId: string;
  amount: number;
};

export type Account = {
  id: string;
  name: string;
  balance: number;
};

export type BudgetBucket = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  walletName?: string;
  walletId?: string;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
};
