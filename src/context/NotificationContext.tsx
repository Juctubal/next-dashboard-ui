'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// Helper function to convert base64 string to Uint8Array for web push
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationContextType {
  supported: boolean;
  subscription: PushSubscription | null;
  permissionState: NotificationPermission;
  subscribing: boolean;
  error: Error | null;
  subscribe: () => Promise<PushSubscription | undefined>;
  unsubscribe: () => Promise<void>;
}

const defaultContext: NotificationContextType = {
  supported: false,
  subscription: null,
  permissionState: 'default',
  subscribing: false,
  error: null,
  subscribe: async () => undefined,
  unsubscribe: async () => {},
};

const NotificationContext = createContext<NotificationContextType>(defaultContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      setSupported(isPushSupported);
      
      if (isPushSupported) {
        // Check notification permission
        setPermissionState(Notification.permission);
        
        // Check for existing subscription
        const getExistingSubscription = async () => {
          try {
            const registration = await navigator.serviceWorker.ready;
            const existingSubscription = await registration.pushManager.getSubscription();
            setSubscription(existingSubscription);
          } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
          }
        };
        
        getExistingSubscription();
      }
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!supported) return;

    setSubscribing(true);
    setError(null);

    try {
      // Request permission if needed
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        setPermissionState(permission);
        
        if (permission !== 'granted') {
          throw new Error('Permission not granted for notifications');
        }
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from the server
      const response = await fetch('/api/push-subscription');
      const { publicKey } = await response.json();

      // Subscribe to push notifications
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save subscription to the server
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: newSubscription,
          userId: 'current-user', // Replace with actual user ID if available
        }),
      });

      setSubscription(newSubscription);
      return newSubscription;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setSubscribing(false);
    }
  }, [supported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      
      // Remove subscription from the server
      await fetch(`/api/push-subscription?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: 'DELETE',
      });

      setSubscription(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    }
  }, [subscription]);

  const value = {
    supported,
    subscription,
    permissionState,
    subscribing,
    error,
    subscribe,
    unsubscribe,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export const useNotifications = function useNotificationsHook() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Also export as a named function for better compatibility
export function getNotificationContext() {
  return useNotifications();
}
