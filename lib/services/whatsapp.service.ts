import { supabase as adminClient } from '@/lib/supabase';
import { financeService } from './finance.service';
import { conversationalParser } from './parser.service';
import { pendingActionService } from './pending-action.service';
import { whatsAppClient } from '../whatsapp/whatsapp-client';
import { SupabaseClient } from '@supabase/supabase-js';

export class WhatsAppService {
  private client: SupabaseClient;

  constructor(customClient?: SupabaseClient) {
    this.client = customClient || adminClient;
  }

  normalizePhoneNumber(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  }

  async findAccountByPhone(phone: string) {
    const cleanPhone = this.normalizePhoneNumber(phone);
    const { data, error } = await this.client
      .from('whatsapp_accounts')
      .select('*')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  generateLinkCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `NF-${code}`;
  }

  async linkAccountWithCode(userId: string, code: string) {
    const trimmed = code.trim().toUpperCase();
    const nowIso = new Date().toISOString();

    const { data: record, error } = await this.client
      .from('whatsapp_accounts')
      .select('*')
      .eq('verification_code', trimmed)
      .gt('verification_expires_at', nowIso)
      .maybeSingle();

    if (error || !record) {
      return {
        success: false,
        message: 'Kode tautan tidak valid atau sudah kedaluwarsa. Silakan chat bot WhatsApp lagi untuk mendapatkan kode baru.',
      };
    }

    const { error: updateErr } = await this.client
      .from('whatsapp_accounts')
      .update({
        user_id: userId,
        status: 'verified',
        verification_code: null,
        verification_expires_at: null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    if (updateErr) {
      return { success: false, message: updateErr.message };
    }

    await whatsAppClient.sendTextMessage(
      record.phone_number,
      `🎉 *Selamat! Akun Noceur Finance Anda berhasil terhubung!*\n\nSekarang Anda dapat mencatat pengeluaran, cek saldo, dan melihat laporan bulanan langsung dari WhatsApp.\n\nKetik *help* untuk melihat panduan penggunaan.`
    );

    return { success: true, message: 'Nomor WhatsApp berhasil dihubungkan ke akun Anda!' };
  }

  async requestWebLink(userId: string, phone: string) {
    const cleanPhone = this.normalizePhoneNumber(phone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error } = await this.client.from('whatsapp_accounts').upsert(
      [
        {
          user_id: userId,
          phone_number: cleanPhone,
          status: 'pending',
          verification_code: code,
          verification_expires_at: expiresAt,
        },
      ],
      { onConflict: 'phone_number' }
    );

    if (error) {
      return { success: false, message: error.message };
    }

    await whatsAppClient.sendTextMessage(
      cleanPhone,
      `🔐 *Kode Verifikasi Noceur Finance*\n\nKode Anda adalah: *${code}*\n\nMasukkan kode ini di website untuk menyelesaikan penautan akun. Kode berlaku selama 15 menit.`
    );

    return { success: true, message: 'Kode verifikasi telah dikirim ke nomor WhatsApp Anda.' };
  }

  async verifyWebOtp(userId: string, code: string) {
    const trimmed = code.trim();
    const nowIso = new Date().toISOString();

    const { data: record, error } = await this.client
      .from('whatsapp_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_code', trimmed)
      .gt('verification_expires_at', nowIso)
      .maybeSingle();

    if (error || !record) {
      return { success: false, message: 'Kode verifikasi salah atau telah kedaluwarsa.' };
    }

    await this.client
      .from('whatsapp_accounts')
      .update({
        status: 'verified',
        verification_code: null,
        verification_expires_at: null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    await whatsAppClient.sendTextMessage(
      record.phone_number,
      `🎉 *Penautan Berhasil!*\nNomor WhatsApp Anda kini telah aktif terhubung ke Noceur Finance.`
    );

    return { success: true, message: 'Nomor WhatsApp berhasil diverifikasi!' };
  }

  async unlinkAccount(userId: string) {
    await this.client.from('whatsapp_accounts').delete().eq('user_id', userId);
    return { success: true };
  }

  async getUserAccount(userId: string) {
    const { data } = await this.client
      .from('whatsapp_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data;
  }

  async handleIncomingMessage(params: {
    senderPhone: string;
    senderName?: string;
    text: string;
    messageId?: string;
    buttonPayload?: string;
  }) {
    const cleanPhone = this.normalizePhoneNumber(params.senderPhone);
    const rawText = (params.buttonPayload || params.text || '').trim();

    let account = await this.findAccountByPhone(cleanPhone);

    if (!account || account.status !== 'verified' || !account.user_id) {
      const code = this.generateLinkCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await this.client.from('whatsapp_accounts').upsert(
        [
          {
            phone_number: cleanPhone,
            display_name: params.senderName || 'WhatsApp User',
            status: 'pending',
            verification_code: code,
            verification_expires_at: expiresAt,
          },
        ],
        { onConflict: 'phone_number' }
      );

      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://noceur-finance.vercel.app';
      const welcomeMessage = `🌟 *Selamat Datang di Noceur Finance!*

Nomor WhatsApp kamu belum terhubung dengan akun Noceur.

Untuk menghubungkan akun:
1. Buka tautan berikut di browser:
👉 ${appBaseUrl}/connect?code=${code}

Atau login ke akun Noceur Finance kamu, buka *Settings > WhatsApp*, lalu masukkan kode:
🔑 *${code}*

_(Kode ini berlaku selama 15 menit)_`;

      await whatsAppClient.sendTextMessage(cleanPhone, welcomeMessage);
      return { replyText: welcomeMessage, actionTaken: 'sent_linking_code' };
    }

    const userId = account.user_id;

    let conversationId: string | null = null;
    const { data: conv } = await this.client
      .from('whatsapp_conversations')
      .select('id')
      .eq('whatsapp_account_id', account.id)
      .maybeSingle();

    if (conv) {
      conversationId = conv.id;
      await this.client
        .from('whatsapp_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      const { data: newConv } = await this.client
        .from('whatsapp_conversations')
        .insert([{ whatsapp_account_id: account.id }])
        .select('id')
        .single();
      conversationId = newConv?.id || null;
    }

    if (conversationId) {
      await this.client.from('whatsapp_messages').insert([
        {
          conversation_id: conversationId,
          direction: 'inbound',
          message_id: params.messageId || null,
          content: rawText,
          message_type: params.buttonPayload ? 'interactive' : 'text',
        },
      ]);
    }

    const activePending = await pendingActionService.getActivePendingAction(userId);

    if (activePending) {
      if (
        params.buttonPayload === 'action_confirm' ||
        /^(ya|y|simpan|ok|oke|yes|confirm|deal|lanjut|sip|save)$/i.test(rawText)
      ) {
        const confirmResult = await pendingActionService.confirmPendingAction(activePending.id);
        if (confirmResult.success) {
          const payload = activePending.payload;
          const wallets = await financeService.getWallets(userId);
          const affectedWallet = wallets.find(
            w => w.id === (payload.fromAccountId || payload.toAccountId)
          );
          const walletBalanceStr = affectedWallet
            ? `\n💳 Saldo ${affectedWallet.name}: Rp${affectedWallet.balance.toLocaleString('id-ID')}`
            : '';

          const reply = `✅ *Transaksi Berhasil Disimpan!*\n\n📝 ${payload.description}\n💸 Rp${Number(
            payload.amount
          ).toLocaleString('id-ID')}\n🏷️ ${payload.category || 'Expense'}${walletBalanceStr}`;

          await whatsAppClient.sendTextMessage(cleanPhone, reply);
          return { replyText: reply, actionTaken: 'confirmed_transaction' };
        } else {
          const reply = `⚠️ ${confirmResult.error || 'Gagal menyimpan transaksi.'}`;
          await whatsAppClient.sendTextMessage(cleanPhone, reply);
          return { replyText: reply, actionTaken: 'confirm_failed' };
        }
      }

      if (
        params.buttonPayload === 'action_cancel' ||
        /^(batal|cancel|gak jadi|ga jadi|jangan|stop|ga|tidak)$/i.test(rawText)
      ) {
        await pendingActionService.cancelPendingAction(activePending.id);
        const reply = `❌ Transaksi telah dibatalkan.`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'cancelled_transaction' };
      }
    }

    const userWallets = await financeService.getWallets(userId);
    const userCategories = await financeService.getCategories(userId);

    const parsedIntent = await conversationalParser.parse(rawText, {
      wallets: userWallets.map(w => w.name),
      categories: userCategories.map(c => c.name),
    });

    if (parsedIntent.type === 'BALANCE_QUERY') {
      const summary = await financeService.getBalanceSummary(userId);
      const lines = summary.accounts.map(
        a => `💳 *${a.name}:* Rp${a.balance.toLocaleString('id-ID')}`
      );

      const reply = `💰 *Ringkasan Saldo Anda*\n\n${
        lines.length > 0 ? lines.join('\n') : 'Belum ada dompet tercatat.'
      }\n\n━━━━━━━━━━━━━━━\n*Total Saldo:* Rp${summary.totalAssets.toLocaleString('id-ID')}`;

      await whatsAppClient.sendTextMessage(cleanPhone, reply);
      return { replyText: reply, actionTaken: 'balance_query' };
    }

    if (parsedIntent.type === 'EXPENSE_QUERY') {
      const summary = await financeService.getExpenseSummary(userId);
      const catLines = summary.topCategories.map(
        c => `• ${c.name}: Rp${c.amount.toLocaleString('id-ID')}`
      );

      const reply = `📊 *Laporan Pengeluaran — ${summary.monthName} ${summary.year}*\n\n💸 *Total Pengeluaran:* Rp${summary.totalExpense.toLocaleString(
        'id-ID'
      )}\n💰 *Total Pemasukan:* Rp${summary.totalIncome.toLocaleString(
        'id-ID'
      )}\n📈 *Savings Rate:* ${summary.savingsRate.toFixed(1)}%\n\n*Top Kategori:*\n${
        catLines.length > 0 ? catLines.join('\n') : '- Belum ada pengeluaran bulan ini -'
      }`;

      await whatsAppClient.sendTextMessage(cleanPhone, reply);
      return { replyText: reply, actionTaken: 'expense_query' };
    }

    if (parsedIntent.type === 'CREATE_TRANSACTION') {
      let fromWallet = userWallets[0] || null;
      let toWallet = userWallets[0] || null;

      if (parsedIntent.fromWalletHint) {
        const found = userWallets.find(w =>
          w.name.toLowerCase().includes(parsedIntent.fromWalletHint!.toLowerCase())
        );
        if (found) fromWallet = found;
      }

      if (parsedIntent.toWalletHint) {
        const found = userWallets.find(w =>
          w.name.toLowerCase().includes(parsedIntent.toWalletHint!.toLowerCase())
        );
        if (found) toWallet = found;
      }

      if (!fromWallet && !toWallet) {
        const defaultWalletId = await financeService.addWallet(userId, 'Cash');
        fromWallet = { id: defaultWalletId, name: 'Cash', balance: 0 };
        toWallet = fromWallet;
      }

      let category = userCategories.find(c =>
        c.name.toLowerCase() === (parsedIntent.categoryHint || '').toLowerCase()
      ) || userCategories[0];

      const payload: any = {
        date: new Date().toISOString().split('T')[0],
        description: parsedIntent.description,
        type: parsedIntent.transactionType,
        amount: parsedIntent.amount,
        category: category ? category.name : 'General',
        categoryId: category ? category.id : null,
      };

      if (parsedIntent.transactionType === 'Expense') {
        payload.fromAccountId = fromWallet ? fromWallet.id : null;
        payload.fromAccountName = fromWallet ? fromWallet.name : 'Cash';
      } else if (parsedIntent.transactionType === 'Income') {
        payload.toAccountId = toWallet ? toWallet.id : null;
        payload.toAccountName = toWallet ? toWallet.name : 'Cash';
      } else if (parsedIntent.transactionType === 'Transfer') {
        payload.fromAccountId = fromWallet ? fromWallet.id : null;
        payload.fromAccountName = fromWallet ? fromWallet.name : 'Cash';
        payload.toAccountId = toWallet ? toWallet.id : null;
        payload.toAccountName = toWallet ? toWallet.name : 'Cash';
      }

      await pendingActionService.createPendingAction(userId, 'create_transaction', payload, 15);

      const walletDisplay =
        parsedIntent.transactionType === 'Transfer'
          ? `${payload.fromAccountName} ➔ ${payload.toAccountName}`
          : payload.fromAccountName || payload.toAccountName || 'Cash';

      const promptBody = `📝 *Konfirmasi Transaksi*\n\n📌 *Catatan:* ${payload.description}\n💸 *Jumlah:* Rp${payload.amount.toLocaleString(
        'id-ID'
      )}\n🏷️ *Kategori:* ${payload.category}\n💳 *Dompet:* ${walletDisplay}\n\nApakah transaksi ini ingin disimpan?`;

      await whatsAppClient.sendInteractiveButtons(cleanPhone, promptBody, [
        { id: 'action_confirm', title: '✅ Simpan' },
        { id: 'action_cancel', title: '❌ Batal' },
      ]);

      return { replyText: promptBody, actionTaken: 'created_pending_action' };
    }

    const helpMessage = `🤖 *Noceur Finance Assistant*\n\nBerikut beberapa contoh pesan yang bisa kamu kirim:\n\n💸 *Catat Pengeluaran:*\n• "keluar 50rb makan siang"\n• "beli kopi 25rb pakai bca"\n• "bayar wifi 300rb"\n\n💰 *Catat Pemasukan:*\n• "gaji masuk 8 juta ke BCA"\n• "dapat 250rb freelance"\n\n🔄 *Transfer Antar Dompet:*\n• "transfer 200rb dari BCA ke Jago"\n\n📊 *Cek Keuangan:*\n• "berapa saldo gue?"\n• "bulan ini habis berapa?"`;

    await whatsAppClient.sendTextMessage(cleanPhone, helpMessage);
    return { replyText: helpMessage, actionTaken: 'sent_help' };
  }
}

export const whatsAppService = new WhatsAppService();
