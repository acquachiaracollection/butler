'use client'

import { useState, useEffect } from 'react'
import { enablePushNotifications, disablePushNotifications, isPushNotificationsEnabled, isPushNotificationsSupported } from '@/lib/push-client'

export function PushNotificationToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    async function checkStatus() {
      try {
        const isSupported = await isPushNotificationsSupported()
        setSupported(isSupported)

        if (isSupported) {
          const isEnabled = await isPushNotificationsEnabled()
          setEnabled(isEnabled)
        }
      } catch (err) {
        console.error('Error checking push notification status:', err)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [])

  const handleToggle = async () => {
    if (!vapidPublicKey) {
      setError('Configurazione push non disponibile')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (enabled) {
        await disablePushNotifications()
        setEnabled(false)
      } else {
        await enablePushNotifications(vapidPublicKey)
        setEnabled(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(message)
      console.error('Error toggling push notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
        Le notifiche push non sono supportate dal tuo browser.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-stone-900">Notifiche Push</label>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-stone-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <p className="text-xs text-stone-600">
        {enabled
          ? 'Riceverai notifiche per nuovi ordini'
          : 'Le notifiche sono disabilitate'}
      </p>
    </div>
  )
}
