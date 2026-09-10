import { supabase as adminClient } from '@/lib/supabase';
import { financeService } from './finance.service';
import { conversationalParser } from './parser.service';
import { pendingActionService } from './pending-action.service';
import { whatsAppClient } from '../whatsapp/whatsapp-client';
import { generateAndUploadExcel } from './excel.service';
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

    (async () => {
      try {
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
      } catch {}
    })();

    const [activePending, userWallets, userCategories] = await Promise.all([
      pendingActionService.getActivePendingAction(userId),
      financeService.getWallets(userId),
      financeService.getCategories(userId),
    ]);

    if (activePending) {
      const lowerText = rawText.trim().toLowerCase();

      if (
        params.buttonPayload === 'action_cancel' ||
        /^(batal|cancel|gak jadi|ga jadi|jangan|stop|ga|tidak|nggak|g|❌|❌\s*batal)$/i.test(lowerText)
      ) {
        await pendingActionService.cancelPendingAction(activePending.id);
        const reply = `❌ Transaksi telah dibatalkan.`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'cancelled_transaction' };
      }

      let chosenWallet = null;
      const numMatch = lowerText.match(/^(?:ya\s+|pilih\s+|pake\s+|pakai\s+|ke\s+|dompet\s+)?([1-9]\d*)$/);
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (idx >= 0 && idx < userWallets.length) {
          chosenWallet = userWallets[idx];
        }
      } else {
        const candidateName = lowerText.replace(/^(?:ya\s+|pilih\s+|pake\s+|pakai\s+|ke\s+|dompet\s+)/, '').trim();
        if (candidateName && !/^(ya|y|iya|simpan|ok|oke|yes|confirm|deal|lanjut|sip|save|betul|bener|benar|batal|cancel)$/.test(candidateName)) {
          chosenWallet = userWallets.find(w =>
            w.name.toLowerCase() === candidateName ||
            w.name.toLowerCase().includes(candidateName) ||
            candidateName.includes(w.name.toLowerCase())
          );
        }
      }

      if (chosenWallet) {
        if (activePending.payload.type === 'Income') {
          activePending.payload.toAccountId = chosenWallet.id;
          activePending.payload.toAccountName = chosenWallet.name;
        } else {
          activePending.payload.fromAccountId = chosenWallet.id;
          activePending.payload.fromAccountName = chosenWallet.name;
        }

        await pendingActionService.updatePendingActionPayload(activePending.id, activePending.payload);
        const confirmResult = await pendingActionService.confirmPendingAction(activePending.id);

        if (confirmResult.success) {
          const payload = activePending.payload;
          const updatedWallets = await financeService.getWallets(userId);
          const affectedWallet = updatedWallets.find(w => w.id === chosenWallet.id) || chosenWallet;
          const reply = `✅ *Transaksi Berhasil Disimpan!*\n\n📝 ${payload.description}\n💸 Rp${Number(
            payload.amount
          ).toLocaleString('id-ID')}\n🏷️ ${payload.category || 'Expense'}\n💳 Dompet: ${affectedWallet.name}\n💳 Sisa Saldo: Rp${affectedWallet.balance.toLocaleString('id-ID')}`;

          await whatsAppClient.sendTextMessage(cleanPhone, reply);
          return { replyText: reply, actionTaken: 'confirmed_transaction_with_wallet' };
        } else {
          const reply = `⚠️ ${confirmResult.error || 'Gagal menyimpan transaksi.'}`;
          await whatsAppClient.sendTextMessage(cleanPhone, reply);
          return { replyText: reply, actionTaken: 'confirm_failed' };
        }
      }

      if (
        params.buttonPayload === 'action_confirm' ||
        /^(ya|y|iya|simpan|ok|oke|yes|confirm|deal|lanjut|sip|save|betul|bener|benar|✅|✅\s*simpan)$/i.test(lowerText)
      ) {
        const confirmResult = await pendingActionService.confirmPendingAction(activePending.id);
        if (confirmResult.success) {
          const payload = activePending.payload;
          const updatedWallets = await financeService.getWallets(userId);
          const affectedWallet = updatedWallets.find(
            w => w.id === (payload.fromAccountId || payload.toAccountId)
          );
          const walletName = payload.fromAccountName || payload.toAccountName || affectedWallet?.name || 'Dompet';
          const walletBalanceStr = affectedWallet
            ? `\n💳 Saldo ${affectedWallet.name}: Rp${affectedWallet.balance.toLocaleString('id-ID')}`
            : '';

          const reply = `✅ *Transaksi Berhasil Disimpan!*\n\n📝 ${payload.description}\n💸 Rp${Number(
            payload.amount
          ).toLocaleString('id-ID')}\n🏷️ ${payload.category || 'Expense'}\n💳 Dompet: ${walletName}${walletBalanceStr}`;

          await whatsAppClient.sendTextMessage(cleanPhone, reply);
          return { replyText: reply, actionTaken: 'confirmed_transaction' };
        } else {
          const reply = `⚠️ ${confirmResult.error || 'Gagal menyimpan transaksi.'}`;
          await whatsAppClient.sendTextMessage(cleanPhone, reply);
          return { replyText: reply, actionTaken: 'confirm_failed' };
        }
      }

      await pendingActionService.cancelPendingAction(activePending.id);
    }

    const parsedIntent = await conversationalParser.parse(rawText, {
      wallets: userWallets.map(w => w.name),
      categories: userCategories.map(c => c.name),
    });

    if (parsedIntent.type === 'WALLETS_QUERY') {
      const summary = await financeService.getBalanceSummary(userId);
      const lines = summary.accounts.map(
        (w, idx) => `${idx + 1}. *${w.name}* — Rp${w.balance.toLocaleString('id-ID')}`
      );

      const reply = `💳 *Daftar Dompet Anda*\n\n${
        lines.length > 0 ? lines.join('\n') : 'Belum ada dompet tercatat.'
      }\n\n━━━━━━━━━━━━━━━\n*Total Saldo:* Rp${summary.totalAssets.toLocaleString('id-ID')}\n\n💡 _Tips:_\n• Ketik *"tambah dompet [nama] [saldo]"* untuk buat dompet baru\n• Ketik *"atur saldo [nama] [jumlah]"* untuk ubah saldo`;

      await whatsAppClient.sendTextMessage(cleanPhone, reply);
      return { replyText: reply, actionTaken: 'wallets_query' };
    }

    if (parsedIntent.type === 'ADD_WALLET') {
      const newWalletName = parsedIntent.walletName.trim();
      try {
        const newWalletId = await financeService.addWallet(userId, newWalletName);
        let initialBalanceStr = '';
        if (parsedIntent.initialBalance && parsedIntent.initialBalance > 0) {
          await financeService.adjustWalletBalance(userId, newWalletId, parsedIntent.initialBalance);
          initialBalanceStr = `\n💰 *Saldo Awal:* Rp${parsedIntent.initialBalance.toLocaleString('id-ID')}`;
        }
        const reply = `✅ *Dompet Berhasil Ditambahkan!*\n\n💳 *Nama Dompet:* ${newWalletName}${initialBalanceStr}\n\nKetik *dompet* untuk melihat daftar semua dompet Anda.`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'added_wallet' };
      } catch (err: any) {
        const reply = `⚠️ Gagal menambahkan dompet: ${err.message || 'Terjadi kesalahan'}`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'add_wallet_error' };
      }
    }

    if (parsedIntent.type === 'ADJUST_WALLET') {
      const targetWallet = userWallets.find(
        w => w.name.toLowerCase() === parsedIntent.walletName.toLowerCase() ||
             w.name.toLowerCase().includes(parsedIntent.walletName.toLowerCase()) ||
             parsedIntent.walletName.toLowerCase().includes(w.name.toLowerCase())
      );

      if (!targetWallet) {
        const reply = `⚠️ Dompet *${parsedIntent.walletName}* tidak ditemukan.\n\nKetik *dompet* untuk melihat daftar dompet Anda.`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'adjust_wallet_not_found' };
      }

      try {
        await financeService.adjustWalletBalance(userId, targetWallet.id, parsedIntent.amount);
        const reply = `✅ *Saldo Dompet Berhasil Diperbarui!*\n\n💳 *Dompet:* ${targetWallet.name}\n💰 *Saldo Baru:* Rp${parsedIntent.amount.toLocaleString('id-ID')}`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'adjusted_wallet' };
      } catch (err: any) {
        const reply = `⚠️ Gagal mengubah saldo: ${err.message || 'Terjadi kesalahan'}`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'adjust_wallet_error' };
      }
    }

    if (parsedIntent.type === 'BUDGETS_QUERY') {
      const budgets = await financeService.getBudgets(userId);
      if (budgets.length === 0) {
        const reply = `📊 *Anggaran / Budget*\n\nAnda belum memiliki anggaran. Buat anggaran di aplikasi web Noceur Finance.`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'budgets_query_empty' };
      }

      let totalTarget = 0;
      const lines = budgets.map(b => {
        totalTarget += b.targetAmount;
        const pct = b.targetAmount > 0 ? ((b.currentAmount / b.targetAmount) * 100).toFixed(0) : '0';
        return `• *${b.name}:* Rp${b.currentAmount.toLocaleString('id-ID')} / Rp${b.targetAmount.toLocaleString('id-ID')} (${pct}%)`;
      });

      const reply = `📊 *Anggaran / Budget Anda*\n\n${lines.join('\n')}\n\n━━━━━━━━━━━━━━━\n*Total Anggaran:* Rp${totalTarget.toLocaleString('id-ID')}`;
      await whatsAppClient.sendTextMessage(cleanPhone, reply);
      return { replyText: reply, actionTaken: 'budgets_query' };
    }

    if (parsedIntent.type === 'GOALS_QUERY') {
      const goals = await financeService.getGoals(userId);
      if (goals.length === 0) {
        const reply = `🎯 *Target Tabungan / Goals*\n\nAnda belum memiliki target tabungan. Buat goal di aplikasi web Noceur Finance.`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'goals_query_empty' };
      }

      const lines = goals.map(g => {
        const pct = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(1) : '0';
        return `• *${g.name}:* Rp${g.currentAmount.toLocaleString('id-ID')} / Rp${g.targetAmount.toLocaleString('id-ID')} (${pct}%)`;
      });

      const reply = `🎯 *Target Tabungan / Goals Anda*\n\n${lines.join('\n')}`;
      await whatsAppClient.sendTextMessage(cleanPhone, reply);
      return { replyText: reply, actionTaken: 'goals_query' };
    }

    if (parsedIntent.type === 'UNDO_TRANSACTION') {
      const lastTxs = await financeService.getTransactions(userId, 1);
      if (lastTxs.length === 0) {
        const reply = `⚠️ Belum ada transaksi yang dapat dibatalkan.`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'undo_empty' };
      }

      const tx = lastTxs[0];
      try {
        await financeService.deleteTransaction(userId, tx.id);
        const walletName = tx.fromAccount !== '-' ? tx.fromAccount : (tx.toAccount !== '-' ? tx.toAccount : 'Dompet');
        const reply = `🗑️ *Transaksi Terakhir Berhasil Dibatalkan!*\n\n📝 ${tx.description}\n💸 Rp${tx.amount.toLocaleString('id-ID')}\n🏷️ ${tx.category}\n💳 Dompet: ${walletName}`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'undone_transaction' };
      } catch (err: any) {
        const reply = `⚠️ Gagal membatalkan transaksi: ${err.message || 'Terjadi kesalahan'}`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'undo_error' };
      }
    }

    if (parsedIntent.type === 'EXPORT_EXCEL') {
      const scopeLabel: Record<string, string> = {
        this_month: 'bulan ini',
        last_month: 'bulan lalu',
        '3_months': '3 bulan terakhir',
        all: 'semua transaksi',
      };
      const label = scopeLabel[parsedIntent.scope] || 'bulan ini';

      const processingMsg = `⏳ Sedang mempersiapkan file Excel *${label}*... Mohon tunggu sebentar.`;
      await whatsAppClient.sendTextMessage(cleanPhone, processingMsg);

      try {
        const { data: profileData } = await this.client
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .maybeSingle();

        const userName = profileData?.name || account.display_name || 'User';
        const allTransactions = await financeService.getTransactions(userId);

        if (allTransactions.length === 0) {
          const reply = `📭 Belum ada transaksi yang bisa diekspor untuk *${label}*.`;
          await whatsAppClient.sendTextMessage(cleanPhone, reply);
          return { replyText: reply, actionTaken: 'export_excel_empty' };
        }

        const publicUrl = await generateAndUploadExcel(
          userId,
          userName,
          allTransactions,
          parsedIntent.scope
        );

        const now = new Date();
        const monthLabel = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const fileName = `NoceurFinance_${label.replace(/\s+/g, '_')}_${now.getFullYear()}.xlsx`;

        await whatsAppClient.sendFileMessage(
          cleanPhone,
          publicUrl,
          fileName,
          `📊 *Laporan Keuangan — ${label}*\n\n✅ File Excel berhasil dibuat dan siap diunduh.\n📅 ${monthLabel}\n💡 _File ini otomatis dihapus setelah terkirim._`
        );

        return { replyText: `Berhasil mengirim file Excel laporan ${label}`, actionTaken: 'export_excel_sent' };
      } catch (err: any) {
        const reply = `⚠️ Gagal membuat file Excel: ${err.message || 'Terjadi kesalahan. Coba lagi nanti.'}`;
        await whatsAppClient.sendTextMessage(cleanPhone, reply);
        return { replyText: reply, actionTaken: 'export_excel_error' };
      }
    }

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
          w.name.toLowerCase() === parsedIntent.fromWalletHint!.toLowerCase() ||
          w.name.toLowerCase().includes(parsedIntent.fromWalletHint!.toLowerCase()) ||
          parsedIntent.fromWalletHint!.toLowerCase().includes(w.name.toLowerCase())
        );
        if (found) fromWallet = found;
      }

      if (parsedIntent.toWalletHint) {
        const found = userWallets.find(w =>
          w.name.toLowerCase() === parsedIntent.toWalletHint!.toLowerCase() ||
          w.name.toLowerCase().includes(parsedIntent.toWalletHint!.toLowerCase()) ||
          parsedIntent.toWalletHint!.toLowerCase().includes(w.name.toLowerCase())
        );
        if (found) toWallet = found;
      }

      if (!fromWallet && !toWallet) {
        const existingWallet = userWallets.find(w => w.name.toLowerCase() === 'cash') || userWallets[0];
        if (existingWallet) {
          fromWallet = existingWallet;
          toWallet = existingWallet;
        } else {
          const defaultWalletId = await financeService.addWallet(userId, 'Cash');
          fromWallet = { id: defaultWalletId, name: 'Cash', balance: 0 };
          toWallet = fromWallet;
          userWallets.push(fromWallet);
        }
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

      const walletListStr = userWallets
        .map((w, idx) => `${idx + 1}. *${w.name}* (Rp${w.balance.toLocaleString('id-ID')})`)
        .join('\n');

      const promptBody = `📝 *Konfirmasi Transaksi*

📌 *Catatan:* ${payload.description}
💸 *Jumlah:* Rp${payload.amount.toLocaleString('id-ID')}
🏷️ *Kategori:* ${payload.category}
💳 *Dompet Terpilih:* ${walletDisplay}

*Pilihan Dompet:*
${walletListStr}

👉 Balas *YA* untuk simpan ke *${walletDisplay}*
👉 Atau ketik nomor *1-${userWallets.length}* / nama dompet (contoh: *1* atau *Jago*) untuk langsung simpan ke dompet tersebut
👉 Balas *BATAL* untuk membatalkan`;

      await whatsAppClient.sendTextMessage(cleanPhone, promptBody);
      return { replyText: promptBody, actionTaken: 'created_pending_action' };
    }

    const helpMessage = `🤖 *Noceur Finance Assistant*

Berikut beberapa contoh pesan yang bisa kamu kirim:

💸 *Catat Transaksi:*
• "keluar 20rb makan siang"
• "beli kopi 25rb pakai bca"
• "gaji masuk 8 juta ke BCA"
• "transfer 200rb BCA ke Jago"

💳 *Kelola Dompet:*
• "dompet" — Cek daftar semua dompet & saldo
• "tambah dompet GoPay 100rb" — Buat dompet baru
• "atur saldo Cash 50rb" — Perbarui saldo dompet

📊 *Cek Keuangan:*
• "berapa saldo gue?" — Total saldo & aset
• "bulan ini habis berapa?" — Laporan bulanan
• "budget" — Cek status anggaran
• "goal" — Cek target tabungan

↩️ *Lainnya:*
• "undo" — Batalkan transaksi terakhir
• "export excel" — Kirim laporan Excel bulan ini
• "export excel bulan lalu" — Laporan bulan lalu
• "export excel semua" — Semua data transaksi`;


    await whatsAppClient.sendTextMessage(cleanPhone, helpMessage);
    return { replyText: helpMessage, actionTaken: 'sent_help' };
  }
}

export const whatsAppService = new WhatsAppService();
