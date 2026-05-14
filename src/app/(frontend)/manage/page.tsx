import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import { OrdersManager } from './OrdersManager'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const titleFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-title',
})

const bodyFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})

export const dynamic = 'force-dynamic'

export default async function ManagePage() {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()

  // Create a request-like object with headers
  const req = {
    headers: headersList,
  }

  // Check authentication
  let user
  try {
    const result = await payload.auth({ headers: headersList })
    user = result.user
  } catch (error) {
    console.log('Auth check failed, redirecting to login')
  }

  if (!user) {
    redirect('/login')
  }

  // Get all orders - access control is enforced at collection level
  let ordersResult
  try {
    ordersResult = await payload.find({
      collection: 'orders',
      depth: 2,
      limit: 100,
      sort: '-createdAt',
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    redirect('/login')
  }

  const orders = ordersResult.docs.map((order) => ({
    id: order.id,
    status: order.status,
    items: (order.items || []).map((item: any) => ({
      quantity: item.quantity,
      note: item.note,
      menuItem: item.menuItem,
    })),
    note: order.note,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    handledBy: order.handledBy,
  }))

  return (
    <main
      className={`${titleFont.variable} ${bodyFont.variable} min-h-screen bg-[linear-gradient(to_bottom,#e0f2fe_0%,#ffffff_100%)] px-3 py-4 text-stone-900 sm:px-6 sm:py-6`}
    >
      <section className="mx-auto w-full max-w-6xl [font-family:var(--font-body)]">
        <header className="mb-6 overflow-hidden rounded-3xl border border-black bg-white/80 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-black">
              Acqua Chiara Collection - Villa Bismarck
            </p>
          </div>

          <h1 className="mt-3 text-4xl leading-none text-black [font-family:var(--font-title)] sm:text-6xl">
            Gestione Ordini
          </h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-lg">
            Visualizza e gestisci tutti gli ordini ricevuti dal kiosk
          </p>
        </header>

        <OrdersManager initialOrders={orders} />
      </section>
    </main>
  )
}
