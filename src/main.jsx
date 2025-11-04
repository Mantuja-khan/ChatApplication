import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Enhanced service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to refresh
              if (confirm('New version available! Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Enhanced PWA installation support
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

// Handle app installed event
window.addEventListener('appinstalled', (e) => {
  console.log('PWA was installed');
  localStorage.setItem('pwa-installed', 'true');
  window.deferredPrompt = null;
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

// Check if app is running in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  localStorage.setItem('pwa-installed', 'true');
  console.log('App is running in standalone mode');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)