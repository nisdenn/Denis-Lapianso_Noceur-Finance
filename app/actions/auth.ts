'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    redirect('/login?error=Missing+credentials');
  }

  if (username.length > 100 || password.length > 256) {
    redirect('/login?error=Invalid+credentials');
  }

  const supabase = createClient();
  const email = username.includes('@') ? username : `${username}@noceur.finance`;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message));
  }

  redirect('/');
}



export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
