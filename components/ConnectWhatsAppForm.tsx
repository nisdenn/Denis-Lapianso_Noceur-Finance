'use client';

import { useState, useTransition } from 'react';
import { linkWithCodeAction } from '@/app/actions/whatsapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, MessageSquare, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ConnectWhatsAppForm({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    startTransition(async () => {
      const res = await linkWithCodeAction(code);
      setResult(res);
    });
  };

  return (
    <div className="space-y-6">
      {result?.success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900">WhatsApp Berhasil Terhubung!</h3>
            <p className="text-sm text-emerald-700 mt-1">{result.message}</p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              Buka Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
            <Link
              href="/settings?tab=whatsapp"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 transition"
            >
              Pengaturan WhatsApp
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {result && !result.success && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{result.message}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kode Verifikasi WhatsApp (Contoh: NF-82KQ)
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="NF-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isPending}
                className="h-12 font-mono text-lg font-bold tracking-widest uppercase text-center border-slate-200 bg-white"
                maxLength={10}
                required
              />
            </div>
            <p className="text-xs text-slate-400">
              Ketik pesan apa saja (misalnya &quot;hi&quot;) ke nomor WhatsApp bot untuk menerima kode.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending || !code.trim()}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghubungkan...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" /> Hubungkan Akun WhatsApp
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
