/**
 * GlamGo Service Worker
 * Handles push notifications and offline functionality
 */

const CACHE_NAME = 'glamgo-cache-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'GlamGo',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'glamgo-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || payload.notification_type || data.tag,
        data: payload.data || payload
      };
    } catch (e) {
      // If not JSON, use as plain text
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false
  };

  // Add default actions based on notification type
  if (data.data?.notification_type === 'order_accepted') {
    options.actions = [
      { action: 'view', title: 'View Order' },
      { action: 'dismiss', title: 'Dismiss' }
    ];
  } else if (data.data?.notification_type === 'provider_on_way') {
    options.actions = [
      { action: 'track', title: 'Track' },
      { action: 'dismiss', title: 'Dismiss' }
    ];
  } else if (data.data?.notification_type === 'order_completed') {
    options.actions = [
      { action: 'review', title: 'Leave Review' },
      { action: 'dismiss', title: 'Dismiss' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = '/orders';

  // Determine target URL based on notification data
  if (notificationData.order_id) {
    targetUrl = `/orders/${notificationData.order_id}`;
  }

  // Handle specific actions
  if (event.action === 'view' || event.action === 'track') {
    targetUrl = notificationData.order_id
      ? `/orders/${notificationData.order_id}`
      : '/orders';
  } else if (event.action === 'review') {
    targetUrl = notificationData.order_id
      ? `/orders/${notificationData.order_id}#review`
      : '/orders?filter=completed_pending_review';
  } else if (event.action === 'dismiss') {
    return;
  }

  // Open or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Notification close event - track dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed');
  // Could send analytics here
});

// Fetch event - basic caching strategy for offline support
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ success: false, error: 'Offline' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
