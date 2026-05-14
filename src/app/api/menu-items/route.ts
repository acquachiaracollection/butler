import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

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
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const description = typeof body?.description === 'string' ? body.description.trim() : ''
    const price = Number(body?.price)
    const category = Number(body?.category)
    const isAvailable = Boolean(body?.isAvailable)
    const image = body?.image === null || body?.image === undefined ? null : Number(body?.image)

    if (!name) {
      return NextResponse.json({ message: 'Nome menu item obbligatorio' }, { status: 400 })
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: 'Prezzo non valido' }, { status: 400 })
    }

    if (!Number.isFinite(category) || category <= 0) {
      return NextResponse.json({ message: 'Categoria non valida' }, { status: 400 })
    }

    if (image !== null && (!Number.isFinite(image) || image <= 0)) {
      return NextResponse.json({ message: 'Immagine non valida' }, { status: 400 })
    }

    const created = await payload.create({
      collection: 'menu-items',
      data: {
        name,
        description,
        price,
        category,
        isAvailable,
        ...(image !== null ? { image } : {}),
      },
    })

    const item = {
      id: created.id,
      name: created.name,
      description: created.description ?? '',
      price: created.price,
      isAvailable: created.isAvailable,
      imageId: typeof created.image === 'number' ? created.image : (created.image?.id ?? null),
      imageUrl: typeof created.image === 'object' ? (created.image?.url ?? null) : null,
      categoryId: typeof created.category === 'number' ? created.category : created.category?.id,
      categoryName: typeof created.category === 'number' ? '' : (created.category?.name ?? ''),
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 },
    )
  }
}
