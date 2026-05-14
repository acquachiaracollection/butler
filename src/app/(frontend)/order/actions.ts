'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type OrderActionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  orderId?: number
}

type RawOrderRow = {
  menuItemId: unknown
  quantity: unknown
  note?: unknown
}

const emptyState: OrderActionState = {
  status: 'idle',
  message: '',
}

const normalizeRow = (row: RawOrderRow) => {
  const menuItemId = Number(row.menuItemId)
  const quantity = Number(row.quantity)
  const note = typeof row.note === 'string' ? row.note.trim() : ''

  if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
    return null
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return null
  }

  if (note.length > 180) {
    return null
  }

  return {
    menuItemId,
    quantity,
    note,
  }
}

export async function submitOrderAction(
  _previousState: OrderActionState = emptyState,
  formData: FormData,
): Promise<OrderActionState> {
  const rawOrderData = formData.get('orderData')
  const rawOrderNote = formData.get('orderNote')

  if (typeof rawOrderData !== 'string' || rawOrderData.trim().length === 0) {
    return {
      status: 'error',
      message: "Aggiungi almeno una portata prima di inviare l'ordine.",
    }
  }

  let parsedRows: unknown

  try {
    parsedRows = JSON.parse(rawOrderData)
  } catch {
    return {
      status: 'error',
      message: 'Formato ordine non valido. Riprova.',
    }
  }

  if (!Array.isArray(parsedRows) || parsedRows.length === 0) {
    return {
      status: 'error',
      message: "Aggiungi almeno una portata prima di inviare l'ordine.",
    }
  }

  const normalizedRows = parsedRows
    .map((row) => normalizeRow(row as RawOrderRow))
    .filter((row): row is NonNullable<ReturnType<typeof normalizeRow>> => row !== null)

  if (normalizedRows.length === 0) {
    return {
      status: 'error',
      message: 'Controlla piatti e quantita selezionate.',
    }
  }

  const ids = [...new Set(normalizedRows.map((row) => row.menuItemId))]

  const payload = await getPayload({ config: configPromise })

  const availableItems = await payload.find({
    collection: 'menu-items',
    where: {
      and: [
        {
          id: {
            in: ids,
          },
        },
        {
          isAvailable: {
            equals: true,
          },
        },
      ],
    },
    depth: 0,
    limit: ids.length,
    overrideAccess: false,
  })

  const availableIds = new Set(availableItems.docs.map((item) => item.id))

  const hasUnavailableItems = normalizedRows.some((row) => !availableIds.has(row.menuItemId))

  if (hasUnavailableItems) {
    return {
      status: 'error',
      message: 'Alcune portate non sono piu disponibili. Aggiorna la pagina e riprova.',
    }
  }

  const orderNote = typeof rawOrderNote === 'string' ? rawOrderNote.trim() : ''

  try {
    const createdOrder = await payload.create({
      collection: 'orders',
      draft: false,
      data: {
        items: normalizedRows.map((row) => ({
          menuItem: row.menuItemId,
          quantity: row.quantity,
          note: row.note || undefined,
        })),
        note: orderNote || undefined,
        status: 'pending',
      },
      overrideAccess: false,
    })

    return {
      status: 'success',
      message: `Ordine #${createdOrder.id} inviato con successo. Grazie!`,
      orderId: createdOrder.id,
    }
  } catch {
    return {
      status: 'error',
      message: "Non siamo riusciti a registrare l'ordine. Riprova tra un attimo.",
    }
  }
}
