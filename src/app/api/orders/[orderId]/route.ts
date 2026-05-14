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
    const { status } = body

    if (!['pending', 'preparing', 'completed', 'canceled'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    // Update order
    const updatedOrder = await payload.update({
      collection: 'orders',
      where: {
        id: {
          equals: parsedOrderId,
        },
      },
      data: {
        status,
        handledBy: user.id,
      },
    })

    return NextResponse.json(updatedOrder, { status: 200 })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 },
    )
  }
}
