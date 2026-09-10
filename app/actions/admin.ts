'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function adminAddUserAction(formData: FormData) {
  const supabaseServer = createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    redirect('/login?error=Unauthorized');
  }

  const { data: profile } = await supabaseServer.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin' || user.user_metadata?.role === 'admin';
  if (!isAdmin) {
    redirect('/login?error=Unauthorized');
  }

  const username = (formData.get('username') as string || '').trim();
  const password = formData.get('password') as string;
  const role = (formData.get('role') as string || 'user').trim();

  if (!username || !password) {
    return { success: false, message: 'Username dan password wajib diisi' };
  }

  if (password.length < 6) {
    return { success: false, message: 'Password minimal 6 karakter' };
  }

  const email = username.includes('@') ? username : `${username}@noceur.finance`;

  try {
    const adminAuthClient = createAdminClient();
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });

    if (error) {
      return { success: false, message: error.message || 'Gagal membuat user' };
    }

    if (data.user) {
      await adminAuthClient
        .from('profiles')
        .update({ role, username: username.includes('@') ? username.split('@')[0] : username })
        .eq('id', data.user.id);
    }
    
    revalidatePath('/admin');
    return { success: true, message: 'User berhasil ditambahkan' };
  } catch (error: any) {
    const errMsg = typeof error?.message === 'string' ? error.message : 'Terjadi kesalahan saat menambahkan user';
    return { success: false, message: errMsg };
  }
}

