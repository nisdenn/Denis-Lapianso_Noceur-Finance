import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { Transaction } from '@/lib/types';

export type ExportScope = 'this_month' | 'last_month' | 'all' | '3_months';

function formatCurrency(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

function getMonthRange(scope: ExportScope): { start: Date; end: Date; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (scope === 'this_month') {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0),
      label: `${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
    };
  }

  if (scope === 'last_month') {
    const lm = month === 0 ? 11 : month - 1;
    const ly = month === 0 ? year - 1 : year;
    return {
      start: new Date(ly, lm, 1),
      end: new Date(ly, lm + 1, 0),
      label: `${new Date(ly, lm, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
    };
  }

  if (scope === '3_months') {
    return {
      start: new Date(year, month - 2, 1),
      end: new Date(year, month + 1, 0),
      label: '3 Bulan Terakhir',
    };
  }

  return {
    start: new Date(2020, 0, 1),
    end: new Date(year, month + 1, 0),
    label: 'Semua Transaksi',
  };
}

export function buildExcelBuffer(
  transactions: Transaction[],
  scope: ExportScope,
  userName: string
): Buffer {
  const { start, end, label } = getMonthRange(scope);

  const filtered = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= start && txDate <= end;
  });

  const wb = XLSX.utils.book_new();

  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'E05452' } } };

  const txRows = [
    ['Tanggal', 'Keterangan', 'Tipe', 'Kategori', 'Dompet Dari', 'Dompet Ke', 'Jumlah (Rp)'],
    ...filtered.map(tx => [
      tx.date,
      tx.description,
      tx.type,
      tx.category || '-',
      tx.fromAccount && tx.fromAccount !== '-' ? tx.fromAccount : '-',
      tx.toAccount && tx.toAccount !== '-' ? tx.toAccount : '-',
      tx.type === 'Expense' ? -tx.amount : tx.amount,
    ]),
  ];

  const txSheet = XLSX.utils.aoa_to_sheet(txRows);

  txSheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi');

  const totalIncome = filtered.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const catMap = new Map<string, number>();
  for (const tx of filtered.filter(t => t.type === 'Expense')) {
    const cat = tx.category || 'Lainnya';
    catMap.set(cat, (catMap.get(cat) || 0) + tx.amount);
  }
  const catEntries = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);

  const summaryRows = [
    [`Laporan Keuangan — ${label}`],
    [`User: ${userName}`],
    [`Dibuat: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['Ringkasan'],
    ['Total Pemasukan', formatCurrency(totalIncome)],
    ['Total Pengeluaran', formatCurrency(totalExpense)],
    ['Selisih Bersih', formatCurrency(netBalance)],
    ['Jumlah Transaksi', filtered.length],
    [],
    ['Kategori Pengeluaran', 'Total'],
    ...catEntries.map(([cat, amt]) => [cat, formatCurrency(amt)]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');

  const rawBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(rawBuffer);
}

export async function generateAndUploadExcel(
  userId: string,
  userName: string,
  transactions: Transaction[],
  scope: ExportScope
): Promise<string> {
  const { label } = getMonthRange(scope);
  const timestamp = Date.now();
  const safeLabel = label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const fileName = `exports/${userId}/${safeLabel}_${timestamp}.xlsx`;

  const buffer = buildExcelBuffer(transactions, scope, userName);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: uploadError } = await supabaseAdmin.storage
    .from('exports')
    .upload(fileName, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload Excel: ${uploadError.message}`);
  }

  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from('exports')
    .createSignedUrl(fileName, 600);

  if (signedError || !signedData?.signedUrl) {
    throw new Error('Failed to create signed URL for exported file');
  }

  setTimeout(() => {
    supabaseAdmin.storage.from('exports').remove([fileName]).catch(() => {});
  }, 620_000);

  return signedData.signedUrl;
}
