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
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ message: 'Endpoint non fornito' }, { status: 400 })
    }

    // Find and delete the subscription
    const { docs } = await payload.find({
      collection: 'push-subscriptions',
      where: {
        endpoint: {
          equals: endpoint,
        },
      },
    })

    if (docs.length === 0) {
      return NextResponse.json(
        { message: 'Sottoscrizione non trovata' },
        { status: 404 },
      )
    }

    const subscription = docs[0]

    // Verify ownership - subscription.user can be either a number (ID) or User object
    const subscriptionUserId = typeof subscription.user === 'object' ? subscription.user.id : subscription.user
    if (subscriptionUserId !== user.id) {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 403 },
      )
    }

    await payload.delete({
      collection: 'push-subscriptions',
      id: subscription.id,
    })

    return NextResponse.json({
      message: 'Sottoscrizione cancellata con successo',
    })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { message: 'Errore durante la cancellazione della sottoscrizione' },
      { status: 500 },
    )
  }
}
