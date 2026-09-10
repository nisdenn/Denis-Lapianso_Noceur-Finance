import assert from 'node:assert';

function parseAmount(text) {
  const cleaned = text.trim().toLowerCase();

  const jutaMatch = cleaned.match(/([\d]+(?:[.,][\d]+)?)\s*(?:jt|juta)\b/i);
  if (jutaMatch) {
    const numStr = jutaMatch[1].replace(',', '.');
    const val = parseFloat(numStr);
    if (!isNaN(val)) return Math.round(val * 1_000_000);
  }

  const ribuMatch = cleaned.match(/([\d]+(?:[.,][\d]+)?)\s*(?:rb|k|ribu)\b/i);
  if (ribuMatch) {
    const numStr = ribuMatch[1].replace(',', '.');
    const val = parseFloat(numStr);
    if (!isNaN(val)) return Math.round(val * 1_000);
  }

  const currencyMatch = cleaned.match(/(?:rp\.?\s*)?([\d]{1,3}(?:\.[\d]{3})+(?:,[\d]{1,2})?|[\d]{3,})/i);
  if (currencyMatch) {
    const numStr = currencyMatch[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(numStr);
    if (!isNaN(val) && val > 0) return Math.round(val);
  }

  return null;
}

function parseRuleBased(text) {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (/^(ya|y|simpan|ok|oke|yes|confirm|deal|lanjut|sip|save|action_confirm)$/i.test(lower)) {
    return { type: 'CONFIRM', raw: trimmed };
  }

  if (/^(batal|cancel|gak jadi|ga jadi|jangan|stop|ga|ngga|tidak|action_cancel)$/i.test(lower)) {
    return { type: 'CANCEL', raw: trimmed };
  }

  if (/^(saldo|cek saldo|berapa saldo( gue| saya| saat ini)?|sisa uang|total saldo|dompet|balance|my balance)\??$/i.test(lower)) {
    return { type: 'BALANCE_QUERY', raw: trimmed };
  }

  if (/(pengeluaran|habis berapa|bulan ini habis berapa|pengeluaran bulan ini|laporan|summary|rekap|stats)\??/i.test(lower) && !/(keluar|beli|bayar|ongkos|makan)\s+\d+/i.test(lower)) {
    return { type: 'EXPENSE_QUERY', raw: trimmed };
  }

  if (/^(help|bantuan|menu|panduan|bisa apa|halo|hi|p|start|mulai)\??$/i.test(lower)) {
    return { type: 'HELP_QUERY', raw: trimmed };
  }

  const transferMatch = lower.match(/(?:transfer|tf|pindah(?:kan)?)\s+([^\s]+(?:\s+(?:jt|juta|rb|k|ribu))?)\s+(?:dari\s+)?([a-z0-9_\-\s]+?)\s+(?:ke\s+)([a-z0-9_\-\s]+)/i);
  if (transferMatch) {
    const amount = parseAmount(transferMatch[1]);
    if (amount && amount > 0) {
      return {
        type: 'CREATE_TRANSACTION',
        transactionType: 'Transfer',
        amount,
        description: `Transfer ${transferMatch[2].trim().toUpperCase()} ke ${transferMatch[3].trim().toUpperCase()}`,
        categoryHint: 'Transfer',
        fromWalletHint: transferMatch[2].trim(),
        toWalletHint: transferMatch[3].trim(),
        raw: trimmed,
      };
    }
  }

  if (/(?:masuk|gaji|income|dapat|terima|bonus|uang masuk)/i.test(lower)) {
    const amount = parseAmount(lower);
    if (amount && amount > 0) {
      const walletMatch = lower.match(/(?:ke|di|masuk ke)\s+([a-z0-9_\-]+)/i);
      return {
        type: 'CREATE_TRANSACTION',
        transactionType: 'Income',
        amount,
        description: 'Gaji Masuk',
        categoryHint: 'Salary',
        toWalletHint: walletMatch ? walletMatch[1] : undefined,
        raw: trimmed,
      };
    }
  }

  const amount = parseAmount(lower);
  if (amount && amount > 0) {
    const walletMatch = lower.match(/(?:pakai|pake|via|dari|lewat)\s+([a-z0-9_\-]+)/i);
    return {
      type: 'CREATE_TRANSACTION',
      transactionType: 'Expense',
      amount,
      description: 'Makan Siang',
      categoryHint: 'Food',
      fromWalletHint: walletMatch ? walletMatch[1] : undefined,
      raw: trimmed,
    };
  }

  return { type: 'UNKNOWN', raw: trimmed };
}

console.log('Testing Amounts:');
assert.strictEqual(parseAmount('50rb'), 50000);
assert.strictEqual(parseAmount('50k'), 50000);
assert.strictEqual(parseAmount('1.5jt'), 1500000);
assert.strictEqual(parseAmount('8 juta'), 8000000);
assert.strictEqual(parseAmount('Rp 25.000'), 25000);
console.log('✅ Amount parsing tests passed!');

console.log('Testing Intents:');
assert.strictEqual(parseRuleBased('ya').type, 'CONFIRM');
assert.strictEqual(parseRuleBased('simpan').type, 'CONFIRM');
assert.strictEqual(parseRuleBased('batal').type, 'CANCEL');
assert.strictEqual(parseRuleBased('berapa saldo gue?').type, 'BALANCE_QUERY');
assert.strictEqual(parseRuleBased('bulan ini habis berapa?').type, 'EXPENSE_QUERY');

const exp = parseRuleBased('keluar 50rb makan siang');
assert.strictEqual(exp.type, 'CREATE_TRANSACTION');
assert.strictEqual(exp.transactionType, 'Expense');
assert.strictEqual(exp.amount, 50000);

const inc = parseRuleBased('gaji masuk 8 juta ke BCA');
assert.strictEqual(inc.type, 'CREATE_TRANSACTION');
assert.strictEqual(inc.transactionType, 'Income');
assert.strictEqual(inc.amount, 8000000);

const tf = parseRuleBased('transfer 200rb dari BCA ke Jago');
assert.strictEqual(tf.type, 'CREATE_TRANSACTION');
assert.strictEqual(tf.transactionType, 'Transfer');
assert.strictEqual(tf.amount, 200000);

console.log('✅ All conversational parsing tests passed successfully!');
