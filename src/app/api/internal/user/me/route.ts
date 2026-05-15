import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()

    const result = await payload.auth({ headers: headersList })

    if (!result.user) {
      return NextResponse.json({ message: 'Non autenticato' }, { status: 401 })
    }

    return NextResponse.json({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json({ message: 'Errore nel recupero utente' }, { status: 500 })
  }
}
