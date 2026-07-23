# Google Sheets Integration

## Authentication
We will use a Google Cloud Service Account.
Required environment variables:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`

## Data Structure
We use a master Google Sheet to store authentication users and user-specific personal finance sheets.

Expected sheets (tabs) in the master sheet:
1. **Users**
   - Username (string)
   - Password (hashed string)
   - Role (string)
   - SheetID (string)

Expected sheets (tabs) in each user sheet:
1. **Transactions**
   - ID (string)
   - Date (date)
   - Description (string)
   - Category (string: Income, Expense, Transfer In, Transfer Out)
   - FromAccount (string)
   - ToAccount (string)
   - Amount (number)

2. **Accounts**
   - AccountName (string)
   - Balance (number)

3. **Budgets/Goals**
   - ID (string)
   - Name (string)
   - TargetAmount (number)
   - CurrentAmount (number)

## Data Fetching
Next.js will fetch data from these sheets via the Google Sheets API (using `google-spreadsheet` or `googleapis`).
We will use React `cache()` or Next.js `unstable_cache` / ISR (with extremely short revalidation) to ensure it stays fast, but triggers `revalidatePath` whenever a new transaction is written.
