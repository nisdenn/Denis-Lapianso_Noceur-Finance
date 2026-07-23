'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      registerServiceWorker();
    } else {
      setLoading(false);
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setSubscription(sub);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Service Worker Error', error);
    } finally {
      setLoading(false);
    }
  }

  async function subscribeToPush() {
    if (!registration) return;
    setLoading(true);
    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      setSubscription(sub);
      setIsSubscribed(true);

      // Save to Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('p256dh')!))));
        const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('auth')!))));

        await supabase.from('push_subscriptions').insert({
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh,
          auth
        });
      }
    } catch (error) {
      console.error('Push Subscription Error', error);
      alert('Gagal mengaktifkan notifikasi: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    if (!subscription) return;
    setLoading(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);

      // Remove from Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint);
      }
    } catch (error) {
      console.error('Unsubscribe Error', error);
    } finally {
      setLoading(false);
    }
  }

  if (typeof window !== 'undefined' && !('serviceWorker' in navigator)) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-amber-800">Push Notifications Tidak Didukung</h3>
        <p className="text-xs text-amber-700 mt-1">Browser ini tidak mendukung Push Notification atau kamu tidak menggunakan koneksi aman (HTTPS / localhost).</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Push Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">Terima notifikasi di perangkat ini bahkan saat website ditutup.</p>
        </div>
        <button
          onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            isSubscribed 
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <BellOff className="w-4 h-4" /> Nonaktifkan
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" /> Aktifkan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
