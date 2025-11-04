// Cache version for updates
const CACHE_NAME = 'v-chats-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo.svg',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Enhanced Service Worker for handling push notifications
self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: data.icon || '/logo.svg',
    badge: '/logo.svg',
    data: {
      url: data.url,
      userId: data.userId,
      senderName: data.senderName
    },
    vibrate: [200, 100, 200],
    tag: 'message-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'reply',
        title: 'Reply',
        icon: '/logo.svg'
      },
      {
        action: 'view',
        title: 'View Chat',
        icon: '/logo.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const userId = event.notification.data.userId;
  const action = event.action;
  
  if (action === 'reply') {
    // Open chat with reply focus
    event.waitUntil(
      clients.matchAll().then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'OPEN_CHAT',
              userId: userId,
              focusInput: true
            });
            return;
          }
        }
        // If no matching client, open new window
        return clients.openWindow(`${self.location.origin}?chat=${userId}&reply=true`);
      })
    );
  } else {
    // Default action - open chat
    event.waitUntil(
      clients.matchAll().then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'OPEN_CHAT',
              userId: userId
            });
            return;
          }
        }
        // If no matching client, open new window
        return clients.openWindow(event.notification.data.url || `${self.location.origin}?chat=${userId}`);
      })
    );
  }
});

// Handle background sync for offline message sending
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle offline message queue
  return new Promise((resolve) => {
    // Implementation for offline message handling
    resolve();
  });
}

// Handle message from main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});