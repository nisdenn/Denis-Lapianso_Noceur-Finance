import { deleteTransaction, getTransactions } from './lib/google-sheets';
import * as fs from 'fs';

async function main() {
  process.env.TEST_SHEET_ID = '1X-C1hHwP5zMrtw5zM3C_n-k1q4O9WlT9k4_r3M'; 

  if (fs.existsSync('noceuru - env.json')) {
    const creds = JSON.parse(fs.readFileSync('noceuru - env.json', 'utf8'));
    process.env.GOOGLE_CLIENT_EMAIL = creds.client_email;
    process.env.GOOGLE_PRIVATE_KEY = creds.private_key;
  }

  const txs = await getTransactions();
  if (txs.length > 0) {
    const firstTx = txs[0];
    console.log('Trying to delete:', firstTx.id);
    await deleteTransaction(firstTx.id);
    console.log('Successfully deleted!');
  } else {
    console.log('No transactions found');
  }
}
main().catch(console.error);
