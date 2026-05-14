import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import { OrderForm } from './OrderForm'

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

export default async function OrderPage() {
  const payload = await getPayload({ config: configPromise })

  const menuItemsResult = await payload.find({
    collection: 'menu-items',
    where: {
      isAvailable: {
        equals: true,
      },
    },
    sort: 'name',
    depth: 1,
    limit: 100,
    overrideAccess: false,
  })

  const menuItems = menuItemsResult.docs.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl:
      item.image && typeof item.image === 'object' && 'url' in item.image
        ? (item.image.url ?? null)
        : null,
  }))

  return (
    <main
      className={`${titleFont.variable} ${bodyFont.variable} min-h-screen bg-[linear-gradient(to_bottom,#e0f2fe_0%,#ffffff_100%)] px-3 py-4 text-stone-900 sm:px-6 sm:py-6`}
    >
      <section className="mx-auto w-full max-w-5xl [font-family:var(--font-body)]">
        <header className="mb-4 overflow-hidden rounded-3xl border border-black bg-white/80 p-5 shadow-xl shadow-black/10 backdrop-blur sm:mb-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-black">
              Acqua Chiara Collection - Villa Bismarck
            </p>
          </div>

          <h1 className="mt-3 text-4xl leading-none text-black [font-family:var(--font-title)] sm:text-6xl">
            Ordina in pochi tap
          </h1>
          {/* <p className="mt-3 max-w-3xl text-sm text-gray-600 sm:text-lg">
            Modalita kiosk per smartphone e tablet: scelta rapida delle portate, conferma immediata
            e nuova sessione pronta al termine.
          </p> */}
        </header>

        <OrderForm menuItems={menuItems} />
      </section>
    </main>
  )
}
