export const dynamic = "force-dynamic";
import { getTransactions } from '@/lib/db';
import { formatCurrency } from '@/lib/finance';
import DeleteTransactionButton from '@/components/DeleteTransactionButton';
import ExportExcelButton from '@/components/ExportExcelButton';

export const revalidate = 0;

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Transactions</h1>
            <p className="text-xs text-slate-500 mt-1">Transaction history and management.</p>
          </div>
          <ExportExcelButton />
        </div>
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm flex flex-col gap-4 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="flex-1 flex justify-center items-center text-slate-400">
            <p className="font-bold">No transactions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map(tx => {
              const type = (tx.type || '').toLowerCase();
              const isIncome = type === 'income';
              const isExpense = type === 'expense';
              const isTransfer = type === 'transfer';
              
              let accountDisplay = tx.fromAccount || tx.toAccount;
              if (isTransfer) {
                accountDisplay = `${tx.fromAccount !== '-' ? tx.fromAccount : '?'} → ${tx.toAccount !== '-' ? tx.toAccount : '?'}`;
              } else if (isIncome) {
                accountDisplay = tx.toAccount !== '-' ? tx.toAccount : 'Income';
              } else if (isExpense) {
                accountDisplay = tx.fromAccount !== '-' ? tx.fromAccount : 'Expense';
              }

              return (
                <div key={tx.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isIncome ? 'bg-emerald-100 text-emerald-600' :
                      isExpense ? 'bg-rose-100 text-rose-600' :
                      'bg-indigo-100 text-indigo-600'
                    }`}>
                      {isIncome ? '+' : isExpense ? '-' : '⇌'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{tx.description}</p>
                      <div className="flex gap-2 items-center mt-0.5">
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                          {tx.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          {accountDisplay} &bull; {tx.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-sm font-bold whitespace-nowrap ${
                      isIncome ? 'text-emerald-600' :
                      isExpense ? 'text-rose-600' :
                      'text-slate-500'
                    }`}>
                      {isIncome ? '+ ' : isExpense ? '- ' : ''}{formatCurrency(tx.amount)}
                    </p>
                    <DeleteTransactionButton id={tx.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
