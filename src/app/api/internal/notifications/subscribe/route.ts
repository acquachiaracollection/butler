import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()

    // Authenticate user via Payload
    const { user } = await payload.auth({ headers: headersList })
    if (!user) {
      return NextResponse.json({ message: 'Utente non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
      return NextResponse.json({ message: 'Dati di sottoscrizione non validi' }, { status: 400 })
    }

    // Check if subscription already exists
    const { docs } = await payload.find({
      collection: 'push-subscriptions',
      where: {
        endpoint: {
          equals: subscription.endpoint,
        },
      },
    })

    if (docs.length > 0) {
      return NextResponse.json({ message: 'Sottoscrizione già registrata' }, { status: 409 })
    }

    // Create new subscription
    const result = await payload.create({
      collection: 'push-subscriptions',
      data: {
        user: user.id,
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
      },
    })

    return NextResponse.json(
      {
        message: 'Sottoscrizione registrata con successo',
        subscription: result,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json(
      { message: 'Errore durante la registrazione della sottoscrizione' },
      { status: 500 },
    )
  }
}
