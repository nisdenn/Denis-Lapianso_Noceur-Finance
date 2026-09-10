'use client';

import { useState, useTransition } from 'react';
import { requestWebLinkAction, verifyWebOtpAction, unlinkWhatsAppAction } from '@/app/actions/whatsapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  CheckCircle2, 
  Unlink, 
  Copy, 
  Check, 
  Send, 
  KeyRound, 
  Sparkles,
  Loader2,
  Phone,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface WhatsAppSettingsCardProps {
  account: {
    id: string;
    phone_number: string;
    status: string;
    verified_at: string | null;
  } | null;
}

export default function WhatsAppSettingsCard({ account }: WhatsAppSettingsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [step, setStep] = useState<'idle' | 'otp'>('idle');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isConnected = account && account.status === 'verified';

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await requestWebLinkAction(phoneInput);
      if (res.success) {
        setStep('otp');
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await verifyWebOtpAction(otpInput);
      if (res.success) {
        setStep('idle');
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    });
  };

  const handleUnlink = () => {
    if (confirm('Apakah kamu yakin ingin memutuskan hubungan akun WhatsApp ini?')) {
      startTransition(async () => {
        await unlinkWhatsAppAction();
        setFeedback({ type: 'success', message: 'Nomor WhatsApp berhasil diputuskan.' });
      });
    }
  };

  const sampleCommands = [
    { label: 'Catat Pengeluaran', command: 'keluar 50rb makan siang' },
    { label: 'Pengeluaran + Dompet', command: 'beli kopi 25rb pakai bca' },
    { label: 'Catat Pemasukan', command: 'gaji masuk 8 juta ke BCA' },
    { label: 'Transfer Antar Dompet', command: 'transfer 200rb dari BCA ke Jago' },
    { label: 'Cek Total Saldo', command: 'berapa saldo gue?' },
    { label: 'Laporan Pengeluaran', command: 'bulan ini habis berapa?' },
  ];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
            isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
          }`}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">WhatsApp Bot Integration</h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {isConnected ? 'Terhubung' : 'Belum Terhubung'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isConnected 
                ? `Nomor terhubung: +${account.phone_number}`
                : 'Hubungkan nomor WhatsApp untuk mengelola keuangan lewat chat.'
              }
            </p>
          </div>
        </div>

        {isConnected && (
          <Button
            variant="outline"
            onClick={handleUnlink}
            disabled={isPending}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold"
          >
            <Unlink className="w-3.5 h-3.5 mr-1.5" /> Putuskan Hubungan
          </Button>
        )}
      </div>

      {feedback && (
        <div className={`rounded-xl p-4 flex items-start gap-3 text-sm ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {!isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-6 border border-indigo-100 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-200/60 text-indigo-700 font-bold text-[10px] uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Metode Paling Mudah
              </div>
              <h4 className="text-base font-bold text-slate-800">Mulai dari WhatsApp</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ketik &quot;hi&quot; atau &quot;halo&quot; ke nomor bot WhatsApp Noceur. Bot akan otomatis mengirimkan kode tautan singkat.
              </p>
            </div>
            <Link
              href="/connect"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
            >
              Masukkan Kode Tautan (NF-XXXX) →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-800">Hubungkan via Nomor HP</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan nomor WhatsApp Anda untuk menerima kode OTP verifikasi.
              </p>
            </div>

            {step === 'idle' ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Nomor WhatsApp (Contoh: 08123456789)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      type="tel"
                      placeholder="0812xxxxxxx"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      disabled={isPending}
                      className="pl-9 h-10 text-sm"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isPending || !phoneInput.trim()}
                  className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                  Kirim Kode OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Kode Verifikasi (OTP)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      type="text"
                      placeholder="6 Digit OTP"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value)}
                      disabled={isPending}
                      className="pl-9 h-10 text-sm tracking-widest font-mono text-center font-bold"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isPending || !otpInput.trim()}
                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                    Verifikasi OTP
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('idle')}
                    className="h-10 text-xs text-slate-500"
                  >
                    Kembali
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Daftar Perintah Chat WhatsApp</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Cukup ketik kalimat alami seperti berikut saat mengirim pesan ke bot Noceur:
            </p>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
            Indonesian NLP
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sampleCommands.map((cmd, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-3.5 border border-slate-200/70 flex items-center justify-between group hover:border-indigo-200 transition"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {cmd.label}
                </span>
                <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                  &quot;{cmd.command}&quot;
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(cmd.command, idx)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title="Salin contoh perintah"
              >
                {copiedIndex === idx ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
