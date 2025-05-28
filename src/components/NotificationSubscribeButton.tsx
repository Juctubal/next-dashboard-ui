'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface NotificationSubscribeButtonProps {
  className?: string;
}

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

const NotificationSubscribeButton: React.FC<
  NotificationSubscribeButtonProps
> = ({ className = "" }) => {
  // State variables
  const [supported, setSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [subscribing, setSubscribing] = useState(false);
  
  // Get current user from Clerk
  const { user, isLoaded: isUserLoaded } = useUser();
  
  // Check if notifications are supported and if the current user is subscribed
  useEffect(() => {
    // Initialize the UI state to not subscribed
    // This ensures we don't show incorrect state while checking
    setIsSubscribed(false);
    setSubscribing(false);
    
    // Don't proceed if user data isn't loaded yet
    if (!isUserLoaded) return;
    
    // Don't proceed if no user is logged in
    if (!user?.id) {
      console.log('No user is logged in, skipping subscription check');
      return;
    }
    
    // Check if push notifications are supported by the browser
    if (typeof window !== 'undefined') {
      const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      setSupported(isPushSupported);
      
      if (isPushSupported) {
        // Check notification permission
        setPermissionState(Notification.permission);
        
        // Check both browser and database subscription status, but don't auto-delete anything
        const checkUserSubscription = async () => {
          try {
            // Always start with not subscribed by default
            setIsSubscribed(false);
            
            console.log(`Checking subscription status for user: ${user.id}`);
            
            // Step 1: Check database status for this user
            const response = await fetch(`/api/push-subscription/user-status?userId=${user.id}`);
            const data = await response.json();
            
            console.log(`Database subscription status for user ${user.id}:`, data);
            
            // If this user doesn't have a database record, they definitely aren't subscribed
            if (!data.isSubscribed) {
              console.log(`User ${user.id} has no subscription in database`);
              setIsSubscribed(false);
              return;
            }
            
            // At this point, we know the user has a database record
            // Let's verify that there's actually a corresponding browser subscription
            // This extra check prevents the UI from incorrectly showing a user as subscribed
            // when they log in on a browser where another user was previously subscribed
            let hasBrowserSubscription = false;
            
            try {
              // Try to get the current browser's push subscription
              if ('serviceWorker' in navigator) {
                // Need to check if service worker is registered first
                const registrations = await navigator.serviceWorker.getRegistrations();
                if (registrations.length > 0) {
                  // At least one service worker registered, we can proceed
                  const registration = await navigator.serviceWorker.ready;
                  const existingSubscription = await registration.pushManager.getSubscription();
                  
                  // If there's a browser subscription, need to verify it matches the user's database record
                  if (existingSubscription) {
                    // Call our endpoint-check API to verify this is the current user's subscription
                    const verifyResponse = await fetch(
                      `/api/push-subscription/endpoint-check?userId=${user.id}&endpoint=${encodeURIComponent(existingSubscription.endpoint)}`
                    );
                    const verifyData = await verifyResponse.json();
                    
                    // Only set subscribed if this endpoint belongs to the current user
                    if (verifyData.isCurrentUser) {
                      console.log(`Browser subscription verified for user ${user.id}`);
                      hasBrowserSubscription = true;
                    } else {
                      console.log(`Browser subscription belongs to a different user, not ${user.id}`);
                      // We'll keep hasBrowserSubscription as false
                      
                      // Force unsubscribe the browser to avoid confusion
                      console.log('Unsubscribing browser to avoid conflicts');
                      await existingSubscription.unsubscribe();
                    }
                  }
                }
              }
            } catch (browserCheckError) {
              console.error('Error checking browser subscription:', browserCheckError);
              // In case of any error, assume no browser subscription
              hasBrowserSubscription = false;
            }
            
            // IMPORTANT: In this new approach, we TRUST the database state as the source of truth
            // Don't delete any subscription data automatically - that could cause legitimate
            // subscriptions to be lost when a user simply refreshes the page
            
            // If the database says the user is subscribed, set UI accordingly
            if (data.isSubscribed) {
              console.log(`Database shows user ${user.id} is subscribed, showing as subscribed in UI`);
              setIsSubscribed(true);
              
              // Optionally log a warning if browser state doesn't match (but don't delete anything)
              if (!hasBrowserSubscription) {
                console.warn(`NOTE: Browser doesn't have a matching subscription but database says subscribed. This may require manual attention if notifications don't work.`);
              }
            } else {
              // Database says not subscribed - set UI to show as unsubscribed
              console.log(`Database shows user ${user.id} is NOT subscribed, showing as unsubscribed in UI`);
              setIsSubscribed(false);
              
              // Optionally log a warning if browser state doesn't match (but don't delete anything)
              if (hasBrowserSubscription) {
                console.warn(`NOTE: Browser has a subscription but database says not subscribed. This may require manual attention.`);
              }
            }
          } catch (error) {
            console.error('Error checking user subscription status:', error);
            setIsSubscribed(false);
          }
        };
        
        checkUserSubscription();
      }
    }
  }, [user?.id, isUserLoaded]);
  
  // Subscribe to push notifications
  const subscribe = async () => {
    if (!supported) {
      toast.error("Push notifications are not supported by your browser");
      return;
    }
    
    if (!user?.id) {
      toast.error("You must be logged in to enable notifications");
      return;
    }

    setSubscribing(true);
    console.log("Starting subscription process...");

    try {
      // IMPORTANT: First clean up any existing subscriptions to prevent conflicts
      // This is crucial for multi-user environments
      console.log("Cleaning up any existing subscriptions first...");
      try {
        // Try to unsubscribe any existing browser subscription
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub) {
            console.log("Found existing browser subscription, unsubscribing first");
            await existingSub.unsubscribe();
            console.log("Successfully unsubscribed from existing subscription");
          }
        }
      } catch (cleanupError) {
        console.error("Error during cleanup phase:", cleanupError);
        // Continue anyway, as we want to create a new subscription
      }

      // Request permission if needed
      console.log("Current permission state:", Notification.permission);
      if (Notification.permission !== 'granted') {
        console.log("Requesting notification permission...");
        const permission = await Notification.requestPermission();
        console.log("Permission result:", permission);
        setPermissionState(permission);
        
        if (permission !== 'granted') {
          throw new Error('Permission not granted for notifications');
        }
      }

      // Verify if service worker is registered
      console.log("Checking service worker registration...");
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      // Register service worker explicitly if needed
      let registration;
      try {
        console.log("Registering service worker...");
        registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log("Service worker registered:", registration);
      } catch (swError) {
        console.error("Service worker registration failed:", swError);
        throw new Error('Service worker registration failed');
      }

      // Wait for the service worker to be ready
      registration = await navigator.serviceWorker.ready;
      console.log("Service worker is ready");

      // Get VAPID public key directly from environment
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      console.log("Using public key:", publicKey ? "[Available]" : "[Missing]");
      
      if (!publicKey) {
        throw new Error('VAPID public key is missing');
      }

      // Subscribe to push notifications - create a fresh subscription
      console.log("Creating new push subscription...");
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      console.log("New push subscription created", newSubscription);

      // Save subscription to the server with current user ID
      console.log(`Saving subscription for user ${user.id} to server...`);
      const saveResponse = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: newSubscription,
          userId: user.id,
        }),
      });
      
      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error("Server response error:", saveResponse.status, errorText);
        throw new Error(`Server error: ${saveResponse.status}`);
      }
      
      const saveResult = await saveResponse.json();
      console.log("Subscription saved:", saveResult);

      // Update local state to reflect subscription
      setIsSubscribed(true);
      toast.success("Successfully subscribed to schedule notifications");
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error("Subscription error:", error);
      
      if (error.message.includes('Permission not granted')) {
        toast.error("You need to allow notifications in your browser settings");
      } else if (error.message.includes('Service worker')) {
        toast.error("Service worker issue. Try refreshing the page");
      } else if (error.message.includes('VAPID')) {
        toast.error("Missing configuration. Contact administrator");
      } else {
        toast.error("Failed to subscribe to notifications: " + error.message);
      }
    } finally {
      setSubscribing(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!user?.id) return;

    try {
      console.log(`Unsubscribing user ${user.id} from notifications...`);
      
      // Try to unsubscribe from browser push manager if available
      let browserUnsubscribed = false;
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const pushSubscription = await registration.pushManager.getSubscription();
          if (pushSubscription) {
            console.log("Found browser subscription, unsubscribing...");
            await pushSubscription.unsubscribe();
            browserUnsubscribed = true;
            console.log("Successfully unsubscribed from browser");
          } else {
            console.log("No browser subscription found to unsubscribe from");
          }
        }
      } catch (browserError) {
        console.error('Error unsubscribing from browser:', browserError);
        // Continue anyway as we'll delete from server
      }
      
      // Always remove subscription from the server for this user
      console.log(`Deleting subscription record for user ${user.id} from server...`);
      const deleteResponse = await fetch(`/api/push-subscription/user?userId=${user.id}`, {
        method: 'DELETE',
      });
      
      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete subscription from server: ${deleteResponse.status}`);
      }

      console.log("Successfully deleted subscription record from server");
      setIsSubscribed(false);
      
      if (browserUnsubscribed) {
        toast.success("Successfully unsubscribed from schedule notifications");
      } else {
        toast.success("Successfully unsubscribed from notifications on server");
      }
    } catch (error) {
      console.error("Error during unsubscribe process:", error);
      toast.error("Failed to unsubscribe from notifications");
    }
  };
  
  const handleSubscribeClick = async () => {
    if (!supported) {
      toast.error("Push notifications are not supported by your browser");
      return;
    }

    // Safety check for user
    if (!user || !user.id) {
      toast.error("You must be logged in to manage notifications");
      return;
    }

    try {
      // Prevent multiple rapid clicks
      setSubscribing(true);
      
      // IMPORTANT: Force check database state first
      console.log('Checking current subscription state in database...');
      const dbResponse = await fetch(`/api/push-subscription/user-status?userId=${user.id}`);
      const dbData = await dbResponse.json();
      const dbSubscribed = dbData.isSubscribed;
      
      // Then check browser state
      console.log('Checking browser subscription state...');
      let browserSubscribed = false;
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length > 0) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            browserSubscribed = !!subscription;
          }
        } catch (browserError) {
          console.error('Error checking browser subscription:', browserError);
          browserSubscribed = false;
        }
      }
      
      // Determine actual subscription state based on both sources
      const actuallySubscribed = dbSubscribed && browserSubscribed;
      console.log('Actual subscription state:', {
        databaseSubscribed: dbSubscribed,
        browserSubscribed: browserSubscribed,
        actuallySubscribed: actuallySubscribed,
        uiState: isSubscribed
      });
      
      // Update UI to match actual state
      if (isSubscribed !== actuallySubscribed) {
        console.log('UI state was incorrect, updating to match actual state');
        setIsSubscribed(actuallySubscribed);
      }
      
      // Force sync browser and database state if they don't match
      if (dbSubscribed !== browserSubscribed) {
        console.log('Database and browser states do not match, syncing...');
        
        if (dbSubscribed && !browserSubscribed) {
          // Database says subscribed but browser isn't - clean up database
          console.log('Cleaning up database record to match browser state');
          await fetch(`/api/push-subscription/user?userId=${user.id}`, { method: 'DELETE' });
          setIsSubscribed(false);
        } else if (!dbSubscribed && browserSubscribed) {
          // Browser is subscribed but database isn't - clean up browser
          console.log('Unsubscribing browser to match database state');
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              await subscription.unsubscribe();
            }
          }
          setIsSubscribed(false);
        }
      }
      
      // Take the appropriate action based on the FINAL determined state
      const finalState = isSubscribed;
      console.log(`Taking action based on final state: ${finalState ? 'subscribed' : 'not subscribed'}`);
      
      if (finalState) {
        console.log('User is subscribed, will unsubscribe');
        await unsubscribe();
      } else {
        console.log('User is not subscribed, will subscribe');
        await subscribe();
      }
    } catch (error) {
      console.error('Error in handleSubscribeClick:', error);
      toast.error("Failed to process subscription request");
    } finally {
      setSubscribing(false);
    }
  };

  // Don't show the button if notifications aren't supported or user isn't loaded yet
  if (!supported || !isUserLoaded || !user) {
    return null;
  }

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      size="sm"
      onClick={handleSubscribeClick}
      disabled={subscribing || permissionState === "denied"}
      className={className}
      title={
        isSubscribed
          ? "Unsubscribe from notifications"
          : "Subscribe to notifications"
      }
    >
      {subscribing ? (
        <span className="animate-spin">...</span>
      ) : isSubscribed ? (
        <>
          <Bell className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Notifications On</span>
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Notifications Off</span>
        </>
      )}
    </Button>
  );
};

export default NotificationSubscribeButton;
