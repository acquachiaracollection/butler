import type { Payload } from 'payload'

interface PushSubscriptionData {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
}

interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, string>
}

export async function sendPushNotification(
  payload: Payload,
  userId: string | number,
  notification: PushNotification,
) {
  try {
    // Fetch push subscriptions for the user
    const { docs: subscriptions } = await payload.find({
      collection: 'push-subscriptions',
      where: {
        user: {
          equals: userId,
        },
      },
      limit: 1000,
    })

    if (!subscriptions.length) {
      console.log(`No push subscriptions found for user ${userId}`)
      return
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendToSubscription(sub as any, notification)),
    )

    // Remove invalid subscriptions
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'rejected') {
        const error = result.reason
        if (error?.status === 410 || error?.status === 404) {
          // Subscription expired or not found
          await payload.delete({
            collection: 'push-subscriptions',
            id: subscriptions[i].id,
          })
          console.log(`Removed expired subscription ${subscriptions[i].id}`)
        }
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
  }
}

export async function sendPushNotificationToAllButlers(
  payload: Payload,
  notification: PushNotification,
) {
  try {
    // Fetch all users with butler role
    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        role: {
          equals: 'butler',
        },
      },
      limit: 1000,
    })

    const results = await Promise.allSettled(
      users.map((user) => sendPushNotification(payload, user.id, notification)),
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    console.log(`Push notification sent to ${succeeded} users, ${failed} failed`)
  } catch (error) {
    console.error('Error sending push notification to butlers:', error)
  }
}

async function sendToSubscription(
  subscription: any,
  notification: PushNotification,
): Promise<void> {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured')
  }

  const webpush = await import('web-push')

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:test@example.com',
    vapidPublicKey,
    vapidPrivateKey,
  )

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || '/icon-192x192.png',
    badge: notification.badge || '/badge-72x72.png',
    tag: notification.tag || 'notification',
    data: notification.data || {},
  })

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.auth,
          p256dh: subscription.p256dh,
        },
      },
      payload,
    )
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription no longer valid
      const err = new Error('Subscription expired')
      ;(err as any).status = error.statusCode
      throw err
    }
    throw error
  }
}
