import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
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

export const metadata: Metadata = {
  title: 'Dashboard Staff | Acqua Chiara',
}

export default async function DashboardPage() {
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

  return (
    <main
      className={`${titleFont.variable} ${bodyFont.variable} min-h-screen bg-[linear-gradient(to_bottom,#e0f2fe_0%,#ffffff_100%)] px-3 py-4 text-stone-900 sm:px-6 sm:py-6`}
    >
      <section className="mx-auto w-full max-w-4xl [font-family:var(--font-body)]">
        <header className="mb-6 overflow-hidden rounded-3xl border border-black bg-white/80 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-black">
            Acqua Chiara Collection - Villa Bismarck
          </p>

          <h1 className="mt-3 text-4xl leading-none text-black [font-family:var(--font-title)] sm:text-6xl">
            Dashboard Staff
          </h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-lg">
            Accedi rapidamente alle sezioni operative del ristorante.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/manage"
            className="group rounded-2xl border border-black bg-white p-6 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black hover:text-white"
          >
            <h2 className="text-2xl font-semibold [font-family:var(--font-title)]">
              Gestione Ordini
            </h2>
            <p className="mt-2 text-sm text-gray-600 transition group-hover:text-gray-200">
              Visualizza e aggiorna lo stato degli ordini in arrivo.
            </p>
          </Link>

          <Link
            href="/inventory"
            className="group rounded-2xl border border-black bg-white p-6 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black hover:text-white"
          >
            <h2 className="text-2xl font-semibold [font-family:var(--font-title)]">
              Inventario Prodotti
            </h2>
            <p className="mt-2 text-sm text-gray-600 transition group-hover:text-gray-200">
              Gestisci menu, disponibilita, prezzi e immagini dei prodotti.
            </p>
          </Link>
        </div>
      </section>
    </main>
  )
}
