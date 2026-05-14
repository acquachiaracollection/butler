import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ menuItemId: string }> },
) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { menuItemId } = await context.params
    const parsedMenuItemId = Number(menuItemId)
    if (!Number.isFinite(parsedMenuItemId) || parsedMenuItemId <= 0) {
      return NextResponse.json({ message: 'Invalid menu item ID' }, { status: 400 })
    }

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

    const data: Record<string, unknown> = {}

    if (typeof body?.name === 'string') {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ message: 'Nome menu item obbligatorio' }, { status: 400 })
      }
      data.name = name
    }

    if (typeof body?.description === 'string') {
      data.description = body.description.trim()
    }

    if (body?.price !== undefined) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ message: 'Prezzo non valido' }, { status: 400 })
      }
      data.price = price
    }

    if (body?.category !== undefined) {
      const category = Number(body.category)
      if (!Number.isFinite(category) || category <= 0) {
        return NextResponse.json({ message: 'Categoria non valida' }, { status: 400 })
      }
      data.category = category
    }

    if (body?.isAvailable !== undefined) {
      data.isAvailable = Boolean(body.isAvailable)
    }

    if (body?.image !== undefined) {
      if (body.image === null) {
        data.image = null
      } else {
        let image = null
        if (typeof body.image === 'number' && body.image > 0) {
          image = body.image
        } else if (
          typeof body.image === 'string' &&
          /^\d+$/.test(body.image) &&
          Number(body.image) > 0
        ) {
          image = Number(body.image)
        } else {
          console.log('Image validation failed, value:', body.image)
          return NextResponse.json({ message: 'Immagine non valida' }, { status: 400 })
        }
        data.image = image
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Nessun campo da aggiornare' }, { status: 400 })
    }

    const updated = await payload.update({
      collection: 'menu-items',
      where: {
        id: {
          equals: parsedMenuItemId,
        },
      },
      data,
    })

    const updatedItem = updated?.docs?.[0]
    if (!updatedItem) {
      return NextResponse.json({ message: 'Menu item non trovato' }, { status: 404 })
    }

    const item = {
      id: updatedItem.id,
      name: updatedItem.name,
      description: updatedItem.description ?? '',
      price: updatedItem.price,
      isAvailable: updatedItem.isAvailable,
      imageId:
        typeof updatedItem.image === 'number' ? updatedItem.image : (updatedItem.image?.id ?? null),
      imageUrl: typeof updatedItem.image === 'object' ? (updatedItem.image?.url ?? null) : null,
      categoryId:
        typeof updatedItem.category === 'number' ? updatedItem.category : updatedItem.category?.id,
      categoryName:
        typeof updatedItem.category === 'number' ? '' : (updatedItem.category?.name ?? ''),
    }

    return NextResponse.json({ item }, { status: 200 })
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ menuItemId: string }> },
) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { menuItemId } = await context.params
    const parsedMenuItemId = Number(menuItemId)
    if (!Number.isFinite(parsedMenuItemId) || parsedMenuItemId <= 0) {
      return NextResponse.json({ message: 'Invalid menu item ID' }, { status: 400 })
    }

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

    const deleted = await payload.delete({
      collection: 'menu-items',
      where: {
        id: {
          equals: parsedMenuItemId,
        },
      },
    })

    if (!deleted?.docs?.length) {
      return NextResponse.json({ message: 'Menu item non trovato' }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 },
    )
  }
}
