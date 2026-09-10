import { GoogleGenAI } from '@google/genai';

export type ParsedIntent =
  | { type: 'CONFIRM'; raw: string }
  | { type: 'CANCEL'; raw: string }
  | { type: 'BALANCE_QUERY'; raw: string }
  | { type: 'EXPENSE_QUERY'; raw: string }
  | { type: 'HELP_QUERY'; raw: string }
  | { type: 'WALLETS_QUERY'; raw: string }
  | { type: 'ADD_WALLET'; walletName: string; initialBalance?: number; raw: string }
  | { type: 'ADJUST_WALLET'; walletName: string; amount: number; raw: string }
  | { type: 'BUDGETS_QUERY'; raw: string }
  | { type: 'GOALS_QUERY'; raw: string }
  | { type: 'UNDO_TRANSACTION'; raw: string }
  | {
      type: 'CREATE_TRANSACTION';
      transactionType: 'Income' | 'Expense' | 'Transfer';
      amount: number;
      description: string;
      categoryHint?: string;
      fromWalletHint?: string;
      toWalletHint?: string;
      raw: string;
    }
  | { type: 'UNKNOWN'; raw: string };

export class ConversationalParserService {
  parseAmount(text: string): number | null {
    const raw = text.trim().toLowerCase();

    const millionMatch = raw.match(/([\d]+(?:[.,][\d]+)?)\s*(?:jt|juta)\b/i);
    if (millionMatch) {
      const value = parseFloat(millionMatch[1].replace(',', '.'));
      if (!isNaN(value)) return Math.round(value * 1_000_000);
    }

    const thousandMatch = raw.match(/([\d]+(?:[.,][\d]+)?)\s*(?:rb|k|ribu)\b/i);
    if (thousandMatch) {
      const value = parseFloat(thousandMatch[1].replace(',', '.'));
      if (!isNaN(value)) return Math.round(value * 1_000);
    }

    const numberMatch = raw.match(/(?:rp\.?\s*)?([\d]{1,3}(?:\.[\d]{3})+(?:,[\d]{1,2})?|[\d]{3,})/i);
    if (numberMatch) {
      const value = parseFloat(numberMatch[1].replace(/\./g, '').replace(',', '.'));
      if (!isNaN(value) && value > 0) return Math.round(value);
    }

    return null;
  }

  parseRuleBased(text: string, context?: { wallets?: string[]; categories?: string[] }): ParsedIntent {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    if (/^(ya|y|iya|simpan|ok|oke|yes|confirm|deal|lanjut|sip|save|betul|bener|benar|action_confirm)$/i.test(lower)) {
      return { type: 'CONFIRM', raw: trimmed };
    }

    if (/^(batal|cancel|gak jadi|ga jadi|jangan|stop|ga|ngga|nggak|tidak|action_cancel)$/i.test(lower)) {
      return { type: 'CANCEL', raw: trimmed };
    }

    if (/^(dompet|daftar dompet|cek dompet|list dompet|wallets|rekening|daftar rekening|saldo dompet)\??$/i.test(lower)) {
      return { type: 'WALLETS_QUERY', raw: trimmed };
    }

    const addWalletMatch = trimmed.match(/^(?:tambah|buat|bikin|add)\s+dompet\s+(.+)/i);
    if (addWalletMatch) {
      const rest = addWalletMatch[1].trim();
      const amount = this.parseAmount(rest);
      let walletName = rest;
      if (amount !== null) {
        walletName = rest.replace(/([\d]+(?:[.,][\d]+)?\s*(?:jt|juta|rb|k|ribu)?|rp\.?\s*[\d.,]+)/gi, '').replace(/(?:saldo|dengan saldo|isi)\s*/gi, '').trim();
      }
      return { type: 'ADD_WALLET', walletName: walletName || 'Baru', initialBalance: amount || 0, raw: trimmed };
    }

    const adjustMatch = trimmed.match(/^(?:atur|edit|ubah|update|set)\s+saldo\s+(.+?)\s+([^\s]+(?:\s+(?:jt|juta|rb|k|ribu))?)$/i);
    if (adjustMatch) {
      const amount = this.parseAmount(adjustMatch[2]);
      if (amount !== null) {
        return { type: 'ADJUST_WALLET', walletName: adjustMatch[1].trim(), amount, raw: trimmed };
      }
    }

    if (/^(?:budget|budgets|anggaran|cek budget|daftar budget|list budget)\??$/i.test(lower)) {
      return { type: 'BUDGETS_QUERY', raw: trimmed };
    }

    if (/^(?:goals?|tabungan|target tabungan|impian|cek goal|target)\??$/i.test(lower)) {
      return { type: 'GOALS_QUERY', raw: trimmed };
    }

    if (/^(?:undo|hapus transaksi(?: terakhir)?|batal(?:kan)? transaksi(?: terakhir)?|delete transaksi)$/i.test(lower)) {
      return { type: 'UNDO_TRANSACTION', raw: trimmed };
    }

    if (/^(saldo|cek saldo|berapa saldo( gue| saya| saat ini)?|sisa uang|total saldo|balance|my balance|duit gue|uang gue)\??$/i.test(lower)) {
      return { type: 'BALANCE_QUERY', raw: trimmed };
    }

    if (
      /(pengeluaran|habis berapa|bulan ini habis berapa|pengeluaran bulan ini|laporan|summary|rekap|stats)\??/i.test(lower) &&
      !/(keluar|beli|bayar|ongkos|makan)\s+\d+/i.test(lower)
    ) {
      return { type: 'EXPENSE_QUERY', raw: trimmed };
    }

    if (/^(help|bantuan|menu|panduan|bisa apa|halo|hai|hi|hey|hello|p|start|mulai|test|tes|ping)\??$/i.test(lower)) {
      return { type: 'HELP_QUERY', raw: trimmed };
    }

    const transferMatch = lower.match(
      /(?:transfer|tf|pindah(?:kan)?)\s+([^\s]+(?:\s+(?:jt|juta|rb|k|ribu))?)\s+(?:dari\s+)?([a-z0-9_\-\s]+?)\s+(?:ke\s+)([a-z0-9_\-\s]+)/i
    );
    if (transferMatch) {
      const amount = this.parseAmount(transferMatch[1]);
      if (amount && amount > 0) {
        const fromWallet = transferMatch[2].replace(/^dari\s+/i, '').trim();
        const toWallet = transferMatch[3].trim();
        return {
          type: 'CREATE_TRANSACTION',
          transactionType: 'Transfer',
          amount,
          description: `Transfer ${fromWallet.toUpperCase()} ke ${toWallet.toUpperCase()}`,
          categoryHint: 'Transfer',
          fromWalletHint: fromWallet,
          toWalletHint: toWallet,
          raw: trimmed,
        };
      }
    }

    if (/(?:masuk|gaji|income|dapat|terima|bonus|uang masuk)/i.test(lower)) {
      const amount = this.parseAmount(lower);
      if (amount && amount > 0) {
        const walletMatch = lower.match(/(?:ke|di|masuk ke)\s+([a-z0-9_\-]+)/i);
        let toWallet = walletMatch ? walletMatch[1].trim() : undefined;
        if (!toWallet && context?.wallets?.length) {
          for (const w of context.wallets) {
            const wLower = w.toLowerCase();
            if (new RegExp(`(?:^|\\s)${wLower}(?:\\s|$)`, 'i').test(lower)) {
              toWallet = w;
              break;
            }
          }
        }

        let description = trimmed
          .replace(/(?:ke|di|masuk ke)\s+[a-z0-9_\-]+/gi, '')
          .replace(/(?:gaji|masuk|income|dapat|terima|bonus|uang masuk)\b/gi, '')
          .replace(/([\d]+(?:[.,][\d]+)?\s*(?:jt|juta|rb|k|ribu)?|rp\.?\s*[\d.,]+)/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (toWallet) {
          description = description.replace(new RegExp(`\\b${toWallet}\\b`, 'gi'), '').trim();
        }

        if (!description || description.length < 2) {
          description = /gaji/i.test(lower) ? 'Gaji Bulanan' : 'Pemasukan';
        }

        return {
          type: 'CREATE_TRANSACTION',
          transactionType: 'Income',
          amount,
          description: description.charAt(0).toUpperCase() + description.slice(1),
          categoryHint: /gaji/i.test(lower) ? 'Salary' : 'Income',
          toWalletHint: toWallet,
          raw: trimmed,
        };
      }
    }

    const amount = this.parseAmount(lower);
    if (amount && amount > 0) {
      const walletMatch = lower.match(/(?:pakai|pake|via|dari|lewat)\s+([a-z0-9_\-]+)/i);
      let fromWallet = walletMatch ? walletMatch[1].trim() : undefined;
      if (!fromWallet && context?.wallets?.length) {
        for (const w of context.wallets) {
          const wLower = w.toLowerCase();
          if (new RegExp(`(?:^|\\s)${wLower}(?:\\s|$)`, 'i').test(lower)) {
            fromWallet = w;
            break;
          }
        }
      }

      let categoryHint = 'Expense';
      if (/makan|kopi|lunch|dinner|sarapan|snack|resto|food|nasi|es|mie|ayam/i.test(lower)) {
        categoryHint = 'Food';
      } else if (/transport|gojek|grab|bensin|toll|tol|parkir|kereta|bus|ojek/i.test(lower)) {
        categoryHint = 'Transport';
      } else if (/belanja|beli|shopping|baju|sepatu|tokopedia|shopee/i.test(lower)) {
        categoryHint = 'Shopping';
      } else if (/tagihan|wifi|listrik|air|pln|pdam|pulsa|kuota/i.test(lower)) {
        categoryHint = 'Bills';
      }

      let description = trimmed
        .replace(/(?:pakai|pake|via|dari|lewat)\s+[a-z0-9_\-]+/gi, '')
        .replace(/(?:keluar|beli|bayar|habis|ongkos|biaya|expense|pake|pakai|via|dari|lewat)\b/gi, '')
        .replace(/([\d]+(?:[.,][\d]+)?\s*(?:jt|juta|rb|k|ribu)?|rp\.?\s*[\d.,]+)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (fromWallet) {
        description = description.replace(new RegExp(`\\b${fromWallet}\\b`, 'gi'), '').trim();
      }

      if (!description || description.length < 2) {
        description = categoryHint === 'Food' ? 'Makan' : 'Pengeluaran';
      }

      return {
        type: 'CREATE_TRANSACTION',
        transactionType: 'Expense',
        amount,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        categoryHint,
        fromWalletHint: fromWallet,
        raw: trimmed,
      };
    }

    return { type: 'UNKNOWN', raw: trimmed };
  }

  async parseWithAi(
    text: string,
    context?: { wallets: string[]; categories: string[] }
  ): Promise<ParsedIntent> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.parseRuleBased(text, context);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const walletList = context?.wallets?.length ? context.wallets.join(', ') : 'BCA, Jago, Cash, SeaBank';
      const categoryList = context?.categories?.length ? context.categories.join(', ') : 'Food, Transport, Shopping, Salary, Expense';

      const prompt = `You are a financial NLP intent parser for Noceur Finance in Indonesian & English.
Analyze the user's message: "${text}"

Available user wallets: [${walletList}]
Available user categories: [${categoryList}]

Respond ONLY with a single JSON object adhering to this schema:
{
  "type": "CONFIRM" | "CANCEL" | "BALANCE_QUERY" | "EXPENSE_QUERY" | "HELP_QUERY" | "CREATE_TRANSACTION" | "UNKNOWN",
  "transactionType": "Income" | "Expense" | "Transfer",
  "amount": number,
  "description": "short title",
  "categoryHint": "best matching category from available list",
  "fromWalletHint": "best matching wallet for source",
  "toWalletHint": "best matching wallet for destination"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim();
      if (!responseText) return this.parseRuleBased(text, context);

      const parsed = JSON.parse(responseText);
      if (parsed.type === 'CREATE_TRANSACTION' && parsed.amount > 0) {
        return {
          type: 'CREATE_TRANSACTION',
          transactionType: parsed.transactionType || 'Expense',
          amount: Number(parsed.amount),
          description: parsed.description || 'Transaksi',
          categoryHint: parsed.categoryHint,
          fromWalletHint: parsed.fromWalletHint,
          toWalletHint: parsed.toWalletHint,
          raw: text,
        };
      }

      if (['CONFIRM', 'CANCEL', 'BALANCE_QUERY', 'EXPENSE_QUERY', 'HELP_QUERY'].includes(parsed.type)) {
        return { type: parsed.type, raw: text } as ParsedIntent;
      }
    } catch {
    }

    return this.parseRuleBased(text, context);
  }

  async parse(
    text: string,
    context?: { wallets: string[]; categories: string[] }
  ): Promise<ParsedIntent> {
    const ruleResult = this.parseRuleBased(text, context);
    if (ruleResult.type !== 'UNKNOWN') {
      return ruleResult;
    }
    return await this.parseWithAi(text, context);
  }
}

export const conversationalParser = new ConversationalParserService();
