'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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

const NavbarNotificationButton = () => {
  // State variables
  const [supported, setSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [subscribingCount, setSubscribingCount] = useState(0);
  
  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      setSupported(isPushSupported);
      
      if (isPushSupported) {
        // Check for existing subscription
        const getExistingSubscription = async () => {
          try {
            const registration = await navigator.serviceWorker.ready;
            const existingSubscription = await registration.pushManager.getSubscription();
            setSubscription(existingSubscription);
          } catch (err) {
            console.error('Error checking subscription:', err);
          }
        };
        
        getExistingSubscription();
      }
    }
    
    // For demo purposes - simulate having one notification
    setSubscribingCount(1);
  }, []);
  
  // Don't show anything if notifications aren't supported
  if (!supported) {
    return null;
  }

  return (
    <Link href="/settings/notifications" className="group">
      <div className="bg-white dark:bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
        <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        {subscribingCount > 0 && (
          <div className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            {subscribingCount}
          </div>
        )}
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {subscription ? "Notifications On" : "Notifications Off"}
        </span>
      </div>
    </Link>
  );
};

export default NavbarNotificationButton;
