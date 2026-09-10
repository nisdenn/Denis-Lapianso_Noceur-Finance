'use client';

import { useState } from 'react';

const SCOPE_OPTIONS = [
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: '3_months', label: '3 Bulan Terakhir' },
  { value: 'all', label: 'Semua Transaksi' },
] as const;

type Scope = typeof SCOPE_OPTIONS[number]['value'];

export default function ExportExcelButton() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleExport(scope: Scope) {
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/export/excel?scope=${scope}`);
      if (!res.ok) throw new Error('Gagal mengekspor data');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        || `NoceurFinance_${scope}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengekspor data. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Mengekspor...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export Excel
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">
            <p className="text-xs text-slate-400 font-semibold px-4 pt-3 pb-1 uppercase tracking-wider">Pilih Rentang</p>
            {SCOPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleExport(opt.value)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
