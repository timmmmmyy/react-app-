// Service Worker for background face touch detection
// This runs independently of the main thread and won't be throttled

let isActive = false;
let lastHeartbeat = Date.now();
let alertsEnabled = true;

// Keep the service worker alive
setInterval(() => {
  lastHeartbeat = Date.now();
  console.log('Service Worker heartbeat:', new Date().toLocaleTimeString());
}, 1000);

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_DETECTION':
      isActive = true;
      console.log('Service Worker: Detection started');
      break;
      
    case 'STOP_DETECTION':
      isActive = false;
      console.log('Service Worker: Detection stopped');
      break;
      
    case 'FACE_TOUCH_DETECTED':
      if (isActive && alertsEnabled) {
        // Play alert even in background
        self.registration.showNotification('Face Touch Alert!', {
          body: 'Stop touching your face!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          silent: false,
          vibrate: [200, 100, 200]
        });
        
        // Debounce alerts
        alertsEnabled = false;
        setTimeout(() => {
          alertsEnabled = true;
        }, 5000);
      }
      break;
      
    case 'PING':
      // Respond to keep connection alive
      event.ports[0].postMessage({ type: 'PONG', timestamp: Date.now() });
      break;
  }
});

// Install and activate events
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
}); 