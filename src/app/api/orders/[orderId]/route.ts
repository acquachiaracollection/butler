import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await context.params
    const parsedOrderId = Number(orderId)

    if (!Number.isFinite(parsedOrderId) || parsedOrderId <= 0) {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    // Check authentication using request headers
    let user
    try {
      const result = await payload.auth({ headers: request.headers })
      user = result.user
    } catch (error) {
      console.log('Auth failed:', error)
    }

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const status = body?.status
    const hasStaffNotes = Object.prototype.hasOwnProperty.call(body ?? {}, 'staffNotes')
    const rawStaffNotes = body?.staffNotes

    if (status === undefined && !hasStaffNotes) {
      return NextResponse.json({ message: 'Nessun campo da aggiornare' }, { status: 400 })
    }

    if (
      status !== undefined &&
      !['pending', 'preparing', 'completed', 'canceled'].includes(status)
    ) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    if (
      hasStaffNotes &&
      rawStaffNotes !== null &&
      rawStaffNotes !== undefined &&
      typeof rawStaffNotes !== 'string'
    ) {
      return NextResponse.json({ message: 'Staff notes non valide' }, { status: 400 })
    }

    const data: Record<string, unknown> = {
      handledBy: user.id,
    }

    if (status !== undefined) {
      data.status = status
    }

    if (hasStaffNotes) {
      data.staffNotes = rawStaffNotes === null ? null : String(rawStaffNotes).trim()
    }

    // Update order
    const updatedOrder = await payload.update({
      collection: 'orders',
      where: {
        id: {
          equals: parsedOrderId,
        },
      },
      data,
    })

    const order = updatedOrder?.docs?.[0]

    if (!order) {
      return NextResponse.json({ message: 'Ordine non trovato' }, { status: 404 })
    }

    return NextResponse.json(
      {
        order: {
          id: order.id,
          status: order.status,
          staffNotes: order.staffNotes ?? '',
          updatedAt: order.updatedAt,
          handledBy: order.handledBy,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 },
    )
  }
}
