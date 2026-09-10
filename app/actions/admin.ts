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
  const isAdmin = profile?.role === 'admin';
  if (!isAdmin) {
    redirect('/login?error=Unauthorized');
  }

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string || 'user';

  if (!username || !password) return;

  const email = username.includes('@') ? username : `${username}@noceur.finance`;

  try {
    const adminAuthClient = createAdminClient();
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { role: role }
    });

    if (error) {
      console.error('Supabase admin create user error:', error.message);
      return { success: false, message: error.message };
    }
    
    revalidatePath('/admin');
    return { success: true, message: 'User created successfully' };
  } catch (error: any) {
    console.error('Error creating user:', error.message);
    return { success: false, message: error.message || 'An error occurred' };
  }
}
