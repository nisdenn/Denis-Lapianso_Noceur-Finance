import { z } from 'zod';

const MAX_AMOUNT = 999_999_999_999;
const MAX_STRING_LENGTH = 500;

export const TransactionSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(MAX_STRING_LENGTH, `Description must not exceed ${MAX_STRING_LENGTH} characters`),
  category: z.enum(['Income', 'Expense', 'Transfer Out', 'Transfer In', 'Transfer', 'Transaction'], {
    message: 'Invalid category',
  }),
  fromAccountId: z.string().max(MAX_STRING_LENGTH).optional().default(''),
  toAccountId: z.string().max(MAX_STRING_LENGTH).optional().default(''),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .finite('Amount must be a finite number')
    .max(MAX_AMOUNT, `Amount exceeds maximum allowed value of ${MAX_AMOUNT}`),
});

export const WalletSchema = z.object({
  name: z
    .string()
    .min(1, 'Wallet name is required')
    .max(100, 'Wallet name must not exceed 100 characters'),
  initialBalance: z
    .number()
    .finite('Initial balance must be a finite number')
    .min(0, 'Initial balance cannot be negative')
    .max(MAX_AMOUNT, `Balance exceeds maximum allowed value`)
    .optional()
    .default(0),
});

export const BudgetSchema = z.object({
  name: z
    .string()
    .min(1, 'Budget name is required')
    .max(100, 'Budget name must not exceed 100 characters'),
  targetAmount: z
    .number({ error: 'Target amount must be a number' })
    .positive('Target amount must be positive')
    .finite('Target amount must be a finite number')
    .max(MAX_AMOUNT, `Target amount exceeds maximum allowed value`),
});

export const GoalSchema = z.object({
  name: z
    .string()
    .min(1, 'Goal name is required')
    .max(100, 'Goal name must not exceed 100 characters'),
  targetAmount: z
    .number({ error: 'Target amount must be a number' })
    .positive('Target amount must be positive')
    .finite('Target amount must be a finite number')
    .max(MAX_AMOUNT, `Target amount exceeds maximum allowed value`),
});

export const WalletBalanceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Wallet name is required').max(100).optional(),
  balance: z
    .number({ error: 'Balance must be a number' })
    .finite('Balance must be a finite number')
    .max(MAX_AMOUNT)
    .min(-MAX_AMOUNT),
});

export const SettingsSchema = z.object({
  userName: z.string().max(100).optional(),
  profileImageUrl: z
    .string()
    .max(2000)
    .refine(v => !v || v === '' || /^https?:\/\/.+/.test(v), { message: 'Profile image URL is not valid' })
    .optional(),
  backgroundImageUrl: z
    .string()
    .max(2000)
    .refine(v => !v || v === '' || /^https?:\/\/.+/.test(v), { message: 'Background image URL is not valid' })
    .optional(),
});

export function safeParseFloat(value: string | null | undefined): number {
  if (!value) return NaN;
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned);
}

export function zodErrors(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(', ');
}
