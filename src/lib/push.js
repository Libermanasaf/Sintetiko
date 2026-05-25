import { supabase } from './supabase';
import { VAPID_PUBLIC_KEY } from './vapidPublic';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.error('Service worker registration failed:', e);
    return null;
  }
}

// Requests permission, subscribes to push, and saves the subscription.
// Returns true on success.
export async function subscribeToPush(userEmail) {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  return saveSubscription(userEmail);
}

// Subscribes silently — only if permission was already granted.
// Used on app load to keep the saved subscription fresh.
export async function ensureSubscribed(userEmail) {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return false;
  if (Notification.permission !== 'granted') return false;
  return saveSubscription(userEmail);
}

async function saveSubscription(userEmail) {
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    if (supabase) {
      const sub = subscription.toJSON();
      await supabase
        .from('push_subscriptions')
        .upsert(
          {
            endpoint: sub.endpoint,
            subscription: sub,
            user_email: userEmail || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
    }
    return true;
  } catch (e) {
    console.error('Failed to save push subscription:', e);
    return false;
  }
}
