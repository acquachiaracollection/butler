/**
 * Client-side utility for Push Notification handling
 */

interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Questo browser non supporta le notifiche')
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    throw new Error('Le notifiche sono state negate dall\'utente')
  }

  return Notification.requestPermission()
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Questo browser non supporta i service worker')
  }

  return navigator.serviceWorker.register('/service-worker.js', {
    scope: '/',
  })
}

export async function subscribeToPushNotifications(
  vapidPublicKey: string,
): Promise<PushSubscriptionJSON> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Questo browser non supporta le push notification')
  }

  // Ensure permission is granted
  const permission = await requestPushPermission()
  if (permission !== 'granted') {
    throw new Error('Permesso per le notifiche non concesso')
  }

  // Register service worker
  const registration = await registerServiceWorker()

  // Get or create subscription
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }

  const json = subscription.toJSON() as PushSubscriptionJSON
  return json
}

export async function unsubscribeFromPushNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    await subscription.unsubscribe()
  }
}

export async function sendSubscriptionToServer(
  subscription: PushSubscriptionJSON,
): Promise<void> {
  const response = await fetch('/api/internal/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ subscription }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Errore nella registrazione della sottoscrizione')
  }
}

export async function removeSubscriptionFromServer(endpoint: string): Promise<void> {
  const response = await fetch('/api/internal/notifications/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ endpoint }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Errore nella cancellazione della sottoscrizione')
  }
}

export async function enablePushNotifications(vapidPublicKey: string): Promise<void> {
  try {
    const subscription = await subscribeToPushNotifications(vapidPublicKey)
    await sendSubscriptionToServer(subscription)
    localStorage.setItem('pushNotificationsEnabled', 'true')
  } catch (error) {
    console.error('Error enabling push notifications:', error)
    throw error
  }
}

export async function disablePushNotifications(): Promise<void> {
  try {
    const subscription = await getServiceWorkerSubscription()
    if (subscription) {
      await removeSubscriptionFromServer(subscription.endpoint)
    }
    await unsubscribeFromPushNotifications()
    localStorage.removeItem('pushNotificationsEnabled')
  } catch (error) {
    console.error('Error disabling push notifications:', error)
    throw error
  }
}

export async function isPushNotificationsSupported(): Promise<boolean> {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Notification.permission !== 'denied'
  )
}

export async function isPushNotificationsEnabled(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  return subscription !== null
}

export async function getServiceWorkerSubscription(): Promise<PushSubscriptionJSON | null> {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      return null
    }

    return subscription.toJSON() as PushSubscriptionJSON
  } catch {
    return null
  }
}

// Helper function from https://github.com/GoogleChromeLabs/web-push-codelab
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

async function getUserId(): Promise<string> {
  // This assumes there's a way to get the user ID from the current session
  // You might need to adjust this based on your auth implementation
  const response = await fetch('/api/internal/user/me')
  if (!response.ok) {
    throw new Error('Unable to get user ID')
  }
  const user = await response.json()
  return user.id || user.doc.id
}
