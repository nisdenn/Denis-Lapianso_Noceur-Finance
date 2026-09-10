export const dynamic = 'force-dynamic';

import ConnectWhatsAppForm from '@/components/ConnectWhatsAppForm';
import { whatsAppService } from '@/lib/services/whatsapp.service';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ConnectWhatsAppPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const existingAccount = await whatsAppService.getUserAccount(user.id);
  const code = searchParams.code || '';

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-xl bg-white/60 border border-white/60 hover:bg-white text-slate-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Hubungkan WhatsApp ke Noceur Finance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat transaksi, cek saldo dompet, dan pantau keuangan semudah mengirim pesan.
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        {existingAccount?.status === 'verified' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Akun WhatsApp Telah Terhubung</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Nomor: +{existingAccount.phone_number}
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-700">
              Kamu bisa langsung mengirim pesan seperti &quot;keluar 50rb makan siang&quot; atau &quot;cek saldo&quot; ke nomor bot Noceur.
            </p>
            <div className="pt-2">
              <Link
                href="/settings?tab=whatsapp"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
              >
                Kelola Nomor WhatsApp di Settings →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ConnectWhatsAppForm initialCode={code} />

            <div className="border-t border-slate-100 pt-6 mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-700">Chat Nomor Bot</h4>
                <p className="text-[11px] text-slate-500">
                  Kirim &quot;hi&quot; atau &quot;halo&quot; ke nomor WhatsApp resmi bot Noceur Finance.
                </p>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-700">Dapatkan Kode</h4>
                <p className="text-[11px] text-slate-500">
                  Bot akan membalas dengan tautan dan kode verifikasi 6 digit (NF-XXXX).
                </p>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-700">Mulai Menggunakan</h4>
                <p className="text-[11px] text-slate-500">
                  Setelah terhubung, bot langsung siap mencatat pengeluaran harianmu secara otomatis.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
