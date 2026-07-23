# API Documentation

## Server Actions

Since we are using Next.js 15 App Router, we will use Server Actions instead of traditional API routes for our mutation logic to integrate smoothly with React 19 forms.

### Transactions

- `addTransaction(data: TransactionData): Promise<{success: boolean, id?: string, error?: string}>`
  Adds a new transaction to the Google Sheet and triggers a Next.js revalidation path (`revalidatePath('/')`).

### Budgets / Goals

- `addBudgetBucket(data: BucketData): Promise<{success: boolean}>`
  Creates a new bucket in the Google Sheet.

### Accounts

- `syncAccounts(): Promise<Account[]>`
  Fetches the latest account balances directly from the Google Sheet and calculates available money.
