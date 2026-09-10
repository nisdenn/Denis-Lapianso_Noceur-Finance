import { supabase as adminClient } from '@/lib/supabase';
import { financeService } from './finance.service';
import { SupabaseClient } from '@supabase/supabase-js';

export type PendingActionRecord = {
  id: string;
  user_id: string;
  channel: string;
  action_type: string;
  payload: any;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export class PendingActionService {
  private client: SupabaseClient;

  constructor(customClient?: SupabaseClient) {
    this.client = customClient || adminClient;
  }

  async createPendingAction(
    userId: string,
    actionType: string,
    payload: any,
    expiresInMinutes = 15,
    channel = 'whatsapp'
  ): Promise<PendingActionRecord> {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    await this.client
      .from('pending_actions')
      .update({ status: 'EXPIRED' })
      .eq('user_id', userId)
      .eq('status', 'PENDING');

    const { data, error } = await this.client
      .from('pending_actions')
      .insert([{
        user_id: userId,
        channel,
        action_type: actionType,
        payload,
        status: 'PENDING',
        expires_at: expiresAt,
      }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async getActivePendingAction(userId: string): Promise<PendingActionRecord | null> {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.client
      .from('pending_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async confirmPendingAction(actionId: string): Promise<{ success: boolean; result?: any; error?: string }> {
    const { data: action, error: fetchErr } = await this.client
      .from('pending_actions')
      .select('*')
      .eq('id', actionId)
      .single();

    if (fetchErr || !action) {
      return { success: false, error: 'Aksi tidak ditemukan' };
    }

    if (action.status !== 'PENDING') {
      return { success: false, error: `Aksi sudah berstatus ${action.status}` };
    }

    if (new Date(action.expires_at).getTime() < Date.now()) {
      await this.client
        .from('pending_actions')
        .update({ status: 'EXPIRED' })
        .eq('id', actionId);
      return { success: false, error: 'Aksi sudah kedaluwarsa' };
    }

    try {
      let execResult: any = null;

      if (action.action_type === 'create_transaction') {
        const payload = action.payload;
        let fromAccountId = payload.fromAccountId || null;
        let toAccountId = payload.toAccountId || null;

        if (payload.type === 'Expense' && !fromAccountId) {
          const wallets = await financeService.getWallets(action.user_id);
          const defaultWallet = wallets.find(w => w.name.toLowerCase() === 'cash') || wallets[0];
          if (defaultWallet) {
            fromAccountId = defaultWallet.id;
          } else {
            const newId = await financeService.addWallet(action.user_id, 'Cash');
            fromAccountId = newId;
          }
        } else if (payload.type === 'Income' && !toAccountId) {
          const wallets = await financeService.getWallets(action.user_id);
          const defaultWallet = wallets.find(w => w.name.toLowerCase() === 'cash') || wallets[0];
          if (defaultWallet) {
            toAccountId = defaultWallet.id;
          } else {
            const newId = await financeService.addWallet(action.user_id, 'Cash');
            toAccountId = newId;
          }
        }

        const txId = await financeService.createTransaction(action.user_id, {
          date: payload.date || new Date().toISOString().split('T')[0],
          description: payload.description,
          type: payload.type,
          category: payload.category,
          categoryId: payload.categoryId || null,
          fromAccountId,
          toAccountId,
          amount: payload.amount,
        });
        execResult = { transactionId: txId };
      }

      await this.client
        .from('pending_actions')
        .update({ status: 'CONFIRMED' })
        .eq('id', actionId);

      return { success: true, result: execResult };
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal menyimpan transaksi' };
    }
  }

  async updatePendingActionPayload(actionId: string, payload: any): Promise<boolean> {
    const { error } = await this.client
      .from('pending_actions')
      .update({ payload, updated_at: new Date().toISOString() })
      .eq('id', actionId);

    return !error;
  }

  async cancelPendingAction(actionId: string): Promise<boolean> {
    const { error } = await this.client
      .from('pending_actions')
      .update({ status: 'CANCELLED' })
      .eq('id', actionId);

    return !error;
  }
}

export const pendingActionService = new PendingActionService();
