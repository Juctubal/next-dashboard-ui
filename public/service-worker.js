// This is the service worker file for push notifications

// Cache name for the app
const CACHE_NAME = 'next-dashboard-cache-v1';

// Install event - caches assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker installed');
});

// Activate event - cleans up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Push event - handles incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  if (!event.data) {
    console.log('No payload');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const options = {
      body: data.body || 'New notification',
      icon: '/logo.ico',
      badge: '/logo.ico',
      data: {
        url: data.url || '/',
      },
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      timestamp: Date.now(),
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Notification',
        options
      )
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
    
    // Fallback for non-JSON data
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Notification', {
        body: text,
        icon: '/logo.ico',
      })
    );
  }
});

// Notification click event - handles what happens when user clicks the notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click');
  
  event.notification.close();
  
  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/';
  
  // Open the URL in a new window/tab
  event.waitUntil(
    clients.matchAll({type: 'window'}).then((windowClients) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is already open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed');
});

console.log('Service Worker loaded');
