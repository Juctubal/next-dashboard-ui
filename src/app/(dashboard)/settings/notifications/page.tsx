'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NotificationSubscribeButton from '@/components/NotificationSubscribeButton';
import NotificationTester from '@/components/NotificationTester';
import { AlertCircle, AlertTriangle, CheckCircle, Bell } from 'lucide-react';

export default function NotificationsPage() {
  // Local state for notification status display only
  const [supported, setSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  
  // Check browser support and permission status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if push notifications are supported
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
            console.error('Error checking subscription:', err);
          }
        };
        
        getExistingSubscription();
      }
    }
    
    // Set up an event listener to update subscription status
    const handleSubscriptionChange = () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.pushManager.getSubscription().then(existingSubscription => {
            setSubscription(existingSubscription);
          });
        });
      }
    };
    
    // Listen for permission changes
    window.addEventListener('pushsubscriptionchange', handleSubscriptionChange);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setPermissionState(Notification.permission);
        handleSubscriptionChange();
      }
    });
    
    return () => {
      window.removeEventListener('pushsubscriptionchange', handleSubscriptionChange);
      document.removeEventListener('visibilitychange', handleSubscriptionChange);
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notification Status
            </CardTitle>
            <CardDescription>
              Enable push notifications to receive alerts when scheduled tasks are due
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Browser Support Status */}
              <div className="flex items-start gap-3">
                {supported ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium">Browser Support</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {supported 
                      ? 'Your browser supports push notifications' 
                      : 'Your browser does not support push notifications. Try a modern browser like Chrome, Firefox, or Edge.'}
                  </p>
                </div>
              </div>
              
              {/* Permission Status */}
              <div className="flex items-start gap-3">
                {permissionState === 'granted' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : permissionState === 'denied' ? (
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium">Notification Permission</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {permissionState === 'granted' 
                      ? 'Permission granted for notifications' 
                      : permissionState === 'denied'
                        ? 'Permission denied. Please update your browser settings to allow notifications from this site.'
                        : 'Permission not requested yet. Click the button below to enable notifications.'}
                  </p>
                </div>
              </div>
              
              {/* Subscription Status */}
              <div className="flex items-start gap-3">
                {subscription ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium">Subscription Status</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subscription 
                      ? 'You are subscribed to push notifications' 
                      : 'You are not subscribed to push notifications'}
                  </p>
                </div>
              </div>
              
              {/* Enable/Disable Button */}
              <div className="mt-6 flex justify-center">
                <NotificationSubscribeButton className="w-full" />
              </div>
              
              {/* Help Text */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Push notifications will be sent when a scheduled task matches the current time. This works for both one-time and recurring schedules.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong>Note:</strong> Push notifications require HTTPS to work. If you are using this application in development mode, 
                you may need to use a secure tunnel like localtunnel or https-localhost.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Card */}
        <NotificationTester />
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>About Schedule Notifications</CardTitle>
            <CardDescription>
              How push notifications work with your schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                When you enable push notifications, the system will automatically check for any schedules that match the current time
                and send you a notification reminder. This works for both one-time schedules and recurring schedules.
              </p>
              
              <h3 className="font-medium mt-4">For one-time schedules:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You'll receive a notification when the scheduled date and time of day (morning, afternoon, or evening) match the current time.
              </p>
              
              <h3 className="font-medium mt-2">For recurring schedules:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You'll receive notifications based on the recurrence pattern:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 ml-4">
                <li>Daily: Every day at the specified time of day</li>
                <li>Weekly: On the specified days of the week at the specified time of day</li>
                <li>Monthly: On the same day of each month at the specified time of day</li>
              </ul>
              
              <p className="text-sm mt-4">
                Notifications will only be sent when the application is open in your browser. For best results, keep the application 
                open in a tab, even if it's not the active tab.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
