'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    redirect('/login?error=Missing+credentials');
  }

  // Basic input sanity
  if (username.length > 100 || password.length > 256) {
    redirect('/login?error=Invalid+credentials');
  }

  const supabase = createClient();
  
  // Notice we use username as email here because Supabase Auth requires an email.
  // We can just append a dummy domain if they literally input 'admin' instead of 'admin@domain.com'.
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
