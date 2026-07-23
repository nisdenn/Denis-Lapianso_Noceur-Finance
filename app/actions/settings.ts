'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { updateSetting } from '@/lib/db';

export async function changePasswordAction(formData: FormData) {
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  
  if (!newPassword || !confirmPassword) return { success: false, message: 'All fields are required' };
  if (newPassword !== confirmPassword) return { success: false, message: 'New passwords do not match' };
  if (newPassword.length < 6) return { success: false, message: 'Password must be at least 6 characters' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Not logged in' };

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/settings');
    return { success: true, message: 'Password updated successfully' };
  } catch (e: any) {
    console.error(e);
    return { success: false, message: e.message || 'An error occurred' };
  }
}

export async function updateSettingsAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Not logged in' };

  try {
    const userName = formData.get('userName') as string;
    const profileImageUrl = formData.get('profileImageUrl') as string;
    const backgroundImageUrl = formData.get('backgroundImageUrl') as string;

    if (userName) await updateSetting('userName', userName);
    if (profileImageUrl !== null) await updateSetting('profileImageUrl', profileImageUrl);
    if (backgroundImageUrl !== null) await updateSetting('backgroundImageUrl', backgroundImageUrl);

    revalidatePath('/', 'layout');
    return { success: true, message: 'Settings updated successfully' };
  } catch (e: any) {
    console.error(e);
    return { success: false, message: e.message || 'An error occurred' };
  }
}
