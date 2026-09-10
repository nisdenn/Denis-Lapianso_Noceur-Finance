'use server';

import { requireAuth } from '@/lib/auth-guard';
import { whatsAppService } from '@/lib/services/whatsapp.service';
import { revalidatePath } from 'next/cache';

export async function linkWithCodeAction(code: string) {
  const user = await requireAuth();
  if (!code || code.trim() === '') {
    return { success: false, message: 'Kode verifikasi tidak boleh kosong.' };
  }

  const result = await whatsAppService.linkAccountWithCode(user.id, code.trim());
  revalidatePath('/settings');
  revalidatePath('/connect');
  return result;
}

export async function requestWebLinkAction(phone: string) {
  const user = await requireAuth();
  if (!phone || phone.trim() === '') {
    return { success: false, message: 'Nomor telepon tidak boleh kosong.' };
  }

  const result = await whatsAppService.requestWebLink(user.id, phone.trim());
  revalidatePath('/settings');
  return result;
}

export async function verifyWebOtpAction(code: string) {
  const user = await requireAuth();
  if (!code || code.trim() === '') {
    return { success: false, message: 'Kode OTP tidak boleh kosong.' };
  }

  const result = await whatsAppService.verifyWebOtp(user.id, code.trim());
  revalidatePath('/settings');
  return result;
}

export async function unlinkWhatsAppAction() {
  const user = await requireAuth();
  const result = await whatsAppService.unlinkAccount(user.id);
  revalidatePath('/settings');
  return result;
}
