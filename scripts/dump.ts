import { getWallets, getTransactions } from './lib/google-sheets';

async function main() {
  const wallets = await getWallets();
  console.log("WALLETS:", wallets);
  const txs = await getTransactions();
  console.log("TXS:", txs);
}
main();
