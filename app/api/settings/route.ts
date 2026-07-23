import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { updateSetting } from '@/lib/db';

export async function POST(request: Request) {
  const formData = await request.formData();
  const userName = formData.get('userName')?.toString() || '';
  const profileImageUrl = formData.get('profileImageUrl')?.toString() || '';
  const backgroundImageUrl = formData.get('backgroundImageUrl')?.toString() || '';
  const reminderEmail = formData.get('reminderEmail')?.toString() || '';

  try {
    if (userName !== '') await updateSetting('userName', userName);
    if (profileImageUrl !== '') await updateSetting('profileImageUrl', profileImageUrl);
    if (backgroundImageUrl !== '') await updateSetting('backgroundImageUrl', backgroundImageUrl);
    if (reminderEmail !== '') await updateSetting('reminderEmail', reminderEmail);

    revalidatePath('/settings');
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to save settings' }, { status: 500 });
  }
}
