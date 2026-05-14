import { Cormorant_Garamond, Manrope } from 'next/font/google'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { LoginForm } from './LoginForm'

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

export default async function LoginPage() {
  const payload = await getPayload({ config: configPromise })

  // Check if user is already authenticated
  try {
    const result = await payload.find({
      collection: 'orders',
      limit: 1,
    })
    // If able to read orders, user is authenticated
    redirect('/manage')
  } catch (error) {
    // User is not authenticated, continue to login page
  }

  return (
    <main
      className={`${titleFont.variable} ${bodyFont.variable} flex min-h-screen items-center justify-center bg-[linear-gradient(to_bottom,#e0f2fe_0%,#ffffff_100%)] px-3 py-4 sm:px-6 sm:py-6`}
    >
      <section className="w-full max-w-md [font-family:var(--font-body)]">
        <div className="rounded-3xl border border-black bg-white/80 p-6 shadow-xl shadow-black/10 backdrop-blur sm:p-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-black">Acqua Chiara Collection</p>

            <h1 className="mt-3 text-4xl leading-none text-black [font-family:var(--font-title)] sm:text-5xl">
              Accedi
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              Inserisci le tue credenziali per gestire gli ordini
            </p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  )
}
