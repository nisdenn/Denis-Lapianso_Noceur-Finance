'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveReminderAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const id = formData.get('id') as string | null
  const title = formData.get('title') as string
  const frequency = formData.get('frequency') as 'daily' | 'weekly' | 'monthly'
  let time = formData.get('time') as string
  if (time && time.length === 5) {
    time = `${time}:00`
  }
  let day_of_week: number | null = null
  if (frequency === 'weekly' && formData.get('day_of_week')) {
    day_of_week = parseInt(formData.get('day_of_week') as string)
  }
  const is_active = formData.get('is_active') === 'true'

  const payload = {
    user_id: user.id,
    title,
    frequency,
    time,
    day_of_week,
    is_active
  }

  if (id) {
    const { error } = await supabase
      .from('reminders')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('reminders')
      .insert(payload)
      
    if (error) throw new Error(error.message)
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteReminderAction(id: string) {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  return { success: true }
}

export async function completeReminderAction(id: string) {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('reminders')
    .update({ last_completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  return { success: true }
}
