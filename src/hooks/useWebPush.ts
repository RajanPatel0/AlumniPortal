'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiFetch, BASE_PATH } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      setLoading(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.getRegistration(`${BASE_PATH}/sw.js`);
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } else {
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error('Error checking push subscription:', err);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in your browser.');
      return false;
    }

    setOperating(true);
    try {
      // 1. Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        if (perm === 'denied') {
          toast.error('Notification permission was blocked. Please enable it in browser settings.');
        }
        setOperating(false);
        return false;
      }

      // 2. Fetch VAPID public key
      const keyRes = await apiFetch('/push/subscribe');
      const { publicKey } = await keyRes.json();

      if (!publicKey) {
        throw new Error('Server VAPID public key is missing');
      }

      // 3. Register or get existing service worker
      let registration = await navigator.serviceWorker.getRegistration(`${BASE_PATH}/sw.js`);
      if (!registration) {
        registration = await navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, {
          scope: `${BASE_PATH}/`,
        });
      }

      await navigator.serviceWorker.ready;

      // 4. Subscribe with PushManager
      const convertedKey = urlBase64ToUint8Array(publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as BufferSource,
      });

      // 5. Send subscription to server
      const saveRes = await apiFetch('/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save subscription on server');
      }

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
      return true;
    } catch (err: unknown) {
      console.error('Push subscription failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to enable push notifications';
      toast.error(msg);
      return false;
    } finally {
      setOperating(false);
    }
  };

  const unsubscribe = async () => {
    setOperating(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration(`${BASE_PATH}/sw.js`);
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Tell server to delete
          await apiFetch('/push/subscribe', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
            }),
          });

          // Unsubscribe locally
          await subscription.unsubscribe();
        }
      }

      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      return true;
    } catch (err: unknown) {
      console.error('Push unsubscription failed:', err);
      toast.error('Failed to disable push notifications');
      return false;
    } finally {
      setOperating(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    operating,
    subscribe,
    unsubscribe,
    refresh: checkSubscription,
  };
}
