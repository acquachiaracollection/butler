'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/internal/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (response.ok && result.user) {
        router.replace('/dashboard')
        router.refresh()
      } else {
        setError(result?.message || 'Email o password non corretti')
      }
    } catch {
      setError('Errore durante il login. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-black">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="user@example.com"
          className="mt-2 w-full rounded-lg border-2 border-black bg-white px-4 py-3 text-base outline-none transition focus:border-black focus:ring-2 focus:ring-gray-300"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-black">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="••••••••"
          className="mt-2 w-full rounded-lg border-2 border-black bg-white px-4 py-3 text-base outline-none transition focus:border-black focus:ring-2 focus:ring-gray-300"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-black bg-white p-4 text-sm text-black">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-base font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? 'Accesso in corso...' : 'Accedi'}
      </button>
    </form>
  )
}
