import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { InventoryManager } from './InventoryManager'

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

export const metadata: Metadata = {
  title: 'Inventario Prodotti | Acqua Chiara',
}

export default async function InventoryPage() {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()

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

  const [menuItemsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'menu-items',
      depth: 1,
      limit: 200,
      sort: 'name',
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'menu-categories',
      limit: 200,
      sort: 'name',
      user,
      overrideAccess: false,
    }),
  ])

  const categories = categoriesResult.docs.map((category) => ({
    id: category.id,
    name: category.name,
  }))

  const menuItems = menuItemsResult.docs.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    price: item.price,
    isAvailable: item.isAvailable,
    imageId: typeof item.image === 'number' ? item.image : (item.image?.id ?? null),
    imageUrl: typeof item.image === 'object' ? (item.image?.url ?? null) : null,
    categoryId:
      typeof item.category === 'number'
        ? item.category
        : (item.category?.id ?? categories[0]?.id ?? 0),
    categoryName: typeof item.category === 'number' ? '' : (item.category?.name ?? ''),
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
            <Link
              href="/dashboard"
              className="rounded-lg border border-black px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-black hover:text-white"
            >
              Torna alla dashboard
            </Link>
          </div>

          <h1 className="mt-3 text-4xl leading-none text-black [font-family:var(--font-title)] sm:text-6xl">
            Inventario Prodotti
          </h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-lg">
            Gestisci prodotti, prezzi, disponibilità e categorie.
          </p>
        </header>

        <InventoryManager initialMenuItems={menuItems} categories={categories} />
      </section>
    </main>
  )
}
