'use client';

import { useTransition, useState } from 'react';
import { submitTransaction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Account } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface TransactionFormProps {
  accounts: Account[];
}

export function TransactionForm({ accounts }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<string>('Expense');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await submitTransaction(formData);
      } catch (err: any) {
        setError(err.message || 'An error occurred while adding the transaction.');
      }
    });
  };

  const accountNames = accounts.map(a => a.name);

  return (
    <Card className="max-w-xl border-zinc-100">
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
        <CardDescription>
          Record a new movement of money. This will update your Database instantly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" value={category} onValueChange={(val) => setCategory(val || 'Expense')} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expense">Expense</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Transfer Out">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="e.g. Grocery, Salary" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (IDR)</Label>
            <Input id="amount" name="amount" type="number" min="0" step="1" placeholder="0" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(category === 'Expense' || category === 'Transfer Out') && (
              <div className="space-y-2">
                <Label htmlFor="fromAccount">From Account</Label>
                <Select name="fromAccount" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(category === 'Income' || category === 'Transfer Out') && (
              <div className="space-y-2">
                <Label htmlFor="toAccount">{category === 'Transfer Out' ? 'To Account' : 'Account'}</Label>
                <Select name="toAccount" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Saving...' : 'Save Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
