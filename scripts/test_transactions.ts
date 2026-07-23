import { getTransactions, deleteTransaction } from './lib/google-sheets';

async function main() {
  const txs = await getTransactions();
  console.log('Transactions:', txs);
  
  if (txs.length > 0) {
    const id = txs[0].id;
    console.log('Attempting to delete transaction with ID:', id);
    // await deleteTransaction(id);
    // console.log('Deleted successfully.');
  }
}
main().catch(console.error);
