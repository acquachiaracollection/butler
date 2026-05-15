self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    }),
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  let notificationData = {}
  try {
    notificationData = event.data.json()
  } catch {
    notificationData = {
      title: 'Notifica',
      body: event.data.text(),
    }
  }

  const options = {
    body: notificationData.body || '',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    tag: notificationData.tag || 'notification',
    data: notificationData.data || {},
    requireInteraction: true,
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Notifica', options),
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const orderId = event.notification.data?.orderId

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find existing window
      for (const client of clientList) {
        if (client.url.includes('/dashboard')) {
          client.focus()
          if (orderId) {
            // Send message to navigate to order
            client.postMessage({
              type: 'NAVIGATE_TO_ORDER',
              orderId: orderId,
            })
          }
          return
        }
      }

      // If no dashboard window, open one
      const targetUrl = orderId ? `/dashboard?orderId=${orderId}` : '/dashboard'
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})

