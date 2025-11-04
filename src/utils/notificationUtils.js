import { supabase } from '../lib/supabase'

let notificationSupported = false;
let swRegistration = null;

export async function initializeNotifications() {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return false;
    }

    // Enhanced service worker registration check
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      try {
        // Wait for service worker to be ready
        swRegistration = await navigator.serviceWorker.ready;
        console.log('Service Worker registered');

        // Get VAPID public key from server
        const serverUrl = process.env.NODE_ENV === 'production' 
          ? 'https://your-backend-url.onrender.com' 
          : 'http://localhost:3000';
          
        try {
          const response = await fetch(`${serverUrl}/api/push/vapid-public-key`);
          const { key } = await response.json();

          // Request permission
          const permission = await Notification.requestPermission();
          notificationSupported = permission === 'granted';

          if (notificationSupported && key) {
            // Subscribe to push notifications
            const subscription = await swRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: key
            });

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Send subscription to server
              await fetch(`${serverUrl}/api/push/subscribe`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  subscription,
                  userId: user.id
                }),
              });
            }
          }
        } catch (serverError) {
          console.log('Server connection failed, using local notifications only');
          // Still allow local notifications even if server is unavailable
          const permission = await Notification.requestPermission();
          notificationSupported = permission === 'granted';
        }
      } catch (error) {
        console.error('Service Worker/Push registration failed:', error);
        // Fallback to basic notifications
        const permission = await Notification.requestPermission();
        notificationSupported = permission === 'granted';
      }
    }

    return notificationSupported;
  } catch (error) {
    console.log('Notification initialization failed:', error.message);
    return false;
  }
}

export function showNotification(title, message, userId, userAvatar = null) {
  // Don't show notification if page is visible and focused
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    return;
  }

  if (!notificationSupported) {
    return;
  }

  try {
    // Truncate long messages for notification
    const truncatedMessage = message.length > 100 ? 
      `${message.substring(0, 100)}...` : message;

    const options = {
      body: truncatedMessage,
      icon: userAvatar || '/logo.svg',
      badge: '/logo.svg',
      tag: `message-${userId}`,
      renotify: true,
      data: {
        userId,
        url: `${window.location.origin}?chat=${userId}`,
        timestamp: Date.now(),
        fullMessage: message
      },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false,
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

    if (swRegistration) {
      // Use service worker to show notification
      swRegistration.showNotification(title, options);
    } else {
      // Fallback to regular notification
      const notification = new Notification(title, options);
      
      notification.onclick = function() {
        window.focus();
        if (this.data?.url) {
          window.location.href = this.data.url;
        }
        notification.close();
      };

      // Auto-close after 8 seconds
      setTimeout(() => {
        notification.close();
      }, 8000);
    }
  } catch (error) {
    console.log('Failed to show notification:', error.message);
  }
}

// Enhanced notification for mobile devices
export function showMobileNotification(senderName, message, userId, userAvatar = null) {
  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) {
    showNotification(senderName, message, userId, userAvatar);
    return;
  }

  // Enhanced mobile notification
  try {
    const options = {
      body: message,
      icon: userAvatar || '/logo.svg',
      badge: '/logo.svg',
      tag: `mobile-message-${userId}`,
      renotify: true,
      data: {
        userId,
        senderName,
        message,
        timestamp: Date.now()
      },
      vibrate: [300, 100, 300, 100, 300], // Longer vibration pattern for mobile
      requireInteraction: true, // Keep notification until user interacts
      silent: false,
      actions: [
        {
          action: 'reply',
          title: '💬 Reply',
          icon: '/logo.svg'
        },
        {
          action: 'view',
          title: '👁️ View',
          icon: '/logo.svg'
        },
        {
          action: 'dismiss',
          title: '❌ Dismiss',
          icon: '/logo.svg'
        }
      ]
    };

    if (swRegistration) {
      swRegistration.showNotification(`💬 ${senderName}`, options);
    } else {
      new Notification(`💬 ${senderName}`, options);
    }
  } catch (error) {
    console.log('Failed to show mobile notification:', error.message);
    // Fallback to regular notification
    showNotification(senderName, message, userId, userAvatar);
  }
}

// Function to handle notification clicks
export function handleNotificationClick(event) {
  event.notification.close();
  
  if (event.action === 'reply') {
    // Open chat with focus on input
    if (clients) {
      clients.matchAll().then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({
              type: 'OPEN_CHAT',
              userId: event.notification.data.userId,
              focusInput: true
            });
            return;
          }
        }
        // If no matching client, open new window
        if (clients.openWindow) {
          return clients.openWindow(`${self.location.origin}?chat=${event.notification.data.userId}&reply=true`);
        }
      });
    }
  } else if (event.action === 'view' || !event.action) {
    // Open or focus the chat
    if (clients) {
      clients.matchAll().then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({
              type: 'OPEN_CHAT',
              userId: event.notification.data.userId
            });
            return;
          }
        }
        // If no matching client, open new window
        if (clients.openWindow) {
          return clients.openWindow(`${self.location.origin}?chat=${event.notification.data.userId}`);
        }
      });
    }
  }
  // For 'dismiss' action, just close the notification (already done above)
}