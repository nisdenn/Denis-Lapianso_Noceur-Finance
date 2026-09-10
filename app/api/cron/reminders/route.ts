import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isTest = searchParams.get('test') === 'true';

    if (isTest) {
      if (process.env.NODE_ENV !== 'development') {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return NextResponse.json({ error: 'Test mode requires authentication' }, { status: 403 });
        }
      }
    } else {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No active reminders found' });
    }

    const now = new Date();
    const currentHours = now.getHours();
    const currentDay = now.getDay();

    const dueReminders = reminders.filter((reminder: any) => {
      if (isTest) return true;

      const [rHours] = reminder.time.split(':').map(Number);
      if (currentHours !== rHours) return false;

      if (reminder.frequency === 'weekly' && reminder.day_of_week !== currentDay) {
        return false;
      }

      if (reminder.last_completed_at) {
        const lastCompleted = new Date(reminder.last_completed_at);
        if (
          lastCompleted.getFullYear() === now.getFullYear() &&
          lastCompleted.getMonth() === now.getMonth() &&
          lastCompleted.getDate() === now.getDate()
        ) {
          return false;
        }
      }

      return true;
    });

    if (dueReminders.length === 0) {
      return NextResponse.json({ message: 'No reminders due this hour' });
    }

    const webpush = require('web-push');
    webpush.setVapidDetails(
      'mailto:admin@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    let pushCount = 0;

    for (const reminder of dueReminders) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', reminder.user_id);

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
              },
              JSON.stringify({
                title: '🔔 Noceur Finance',
                body: reminder.title,
                url: '/reminders'
              })
            );
            pushCount++;
          } catch (e: any) {
            console.error('Push error:', e.message);
            if (e.statusCode === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersDue: dueReminders.length,
      pushSent: pushCount
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
