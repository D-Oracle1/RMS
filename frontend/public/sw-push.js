/* eslint-disable no-undef */

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { title: 'New Notification', body: event.data?.text() || '' };
  }

  const isCall = data.data?.type === 'call:incoming';
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    tag: isCall ? 'incoming-call' : (data.data?.notificationId || 'default'),
    data: {
      url: data.data?.link || '/',
      ...data.data,
    },
    // Calls: long repeating vibration; regular: short
    vibrate: isCall
      ? [500, 200, 500, 200, 500, 200, 500, 200, 500]
      : [200, 100, 200],
    // Calls and urgent notifications stay on screen until dismissed
    requireInteraction: isCall || data.data?.priority === 'URGENT',
    // Show action buttons for calls
    actions: isCall
      ? [
          { action: 'open', title: '📱 Open App' },
        ]
      : [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      if (navigator.setAppBadge) {
        self.registration.getNotifications().then((notifications) => {
          navigator.setAppBadge(notifications.length);
        });
      }
    })
  );
});

// Handle notification click — open the app and navigate
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    Promise.all([
      // Clear the badge when user taps a notification
      self.registration.getNotifications().then((notifications) => {
        if (notifications.length === 0 && navigator.clearAppBadge) {
          navigator.clearAppBadge();
        } else if (navigator.setAppBadge) {
          navigator.setAppBadge(notifications.length);
        }
      }),
      // Focus or open the app
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
    ])
  );
});

// Clear badge when app becomes focused
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge();
    }
    // Also close all notifications when app is opened
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach((n) => n.close());
    });
  }
});
