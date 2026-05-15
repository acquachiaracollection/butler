'use client'

import Image from 'next/image'
import { FormEvent, useActionState, useEffect, useMemo, useRef, useState } from 'react'
import type { OrderActionState } from './actions'
import { submitOrderAction } from './actions'

type MenuItemOption = {
  id: number
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
}

type OrderRow = {
  menuItemId: number
  quantity: number
  note: string
}

type OrderFormProps = {
  menuItems: MenuItemOption[]
}

const initialState: OrderActionState = {
  status: 'idle',
  message: '',
}

const formatEuro = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function OrderForm({ menuItems }: OrderFormProps) {
  const submitLockRef = useRef(false)
  const [submitLocked, setSubmitLocked] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [rows, setRows] = useState<OrderRow[]>([])
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)

  const [state, formAction, pending] = useActionState(submitOrderAction, initialState)

  useEffect(() => {
    if (state.status === 'success') {
      setRows([])
      setOrderNote('')
      setShowSuccessScreen(true)
    }

    if (state.status !== 'idle') {
      submitLockRef.current = false
      setSubmitLocked(false)
    }
  }, [state.status])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (submitLockRef.current || submitLocked || pending) {
      event.preventDefault()
      return
    }

    submitLockRef.current = true
    setSubmitLocked(true)
  }

  const menuItemMap = useMemo(() => {
    return new Map(menuItems.map((item) => [item.id, item]))
  }, [menuItems])

  const total = useMemo(() => {
    return rows.reduce((acc, row) => {
      const item = menuItemMap.get(row.menuItemId)
      if (!item) return acc
      return acc + item.price * row.quantity
    }, 0)
  }, [menuItemMap, rows])

  const addMenuItem = (menuItemId: number) => {
    setRows((currentRows) => {
      const existingIndex = currentRows.findIndex(
        (row) => row.menuItemId === menuItemId && row.note === '',
      )

      if (existingIndex >= 0) {
        return currentRows.map((row, idx) =>
          idx === existingIndex ? { ...row, quantity: Math.min(20, row.quantity + 1) } : row,
        )
      }

      return [
        ...currentRows,
        {
          menuItemId,
          quantity: 1,
          note: '',
        },
      ]
    })
  }

  const updateRow = <K extends keyof OrderRow>(index: number, key: K, value: OrderRow[K]) => {
    setRows((currentRows) =>
      currentRows.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)),
    )
  }

  const removeRow = (index: number) => {
    setRows((currentRows) => currentRows.filter((_, idx) => idx !== index))
  }

  const clearCart = () => {
    setRows([])
    setOrderNote('')
  }

  // Success screen
  if (showSuccessScreen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <div className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
          Ordine confermato
        </div>
        <h2 className="text-5xl leading-none [font-family:var(--font-title)] text-black sm:text-6xl">
          Grazie!
        </h2>
        <p className="max-w-md text-lg text-gray-600">{state.message}</p>
        <button
          type="button"
          onClick={() => {
            window.location.reload()
          }}
          className="mt-4 rounded-2xl bg-black px-8 py-4 text-lg font-semibold text-white transition hover:bg-stone-800"
        >
          Nuovo ordine
        </button>
      </div>
    )
  }

  // Main kiosk interface

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="relative flex min-h-screen flex-col"
    >
      <input name="orderData" type="hidden" value={JSON.stringify(rows)} />
      <input name="orderNote" type="hidden" value={orderNote} />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto pb-40 sm:pb-44">
        <div className="space-y-6 p-6 sm:p-8">
          {/* Menu items grid */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-black [font-family:var(--font-title)] sm:text-3xl">
              Scegli i tuoi piatti
            </h2>
            <p className="text-sm text-gray-600">Tocca una card per aggiungere all'ordine.</p>
          </div>

          {menuItems.length === 0 ? (
            <div className="rounded-2xl border border-black bg-white p-6 text-base text-black">
              Nessun piatto disponibile al momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addMenuItem(item.id)}
                  disabled={pending || submitLocked}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-black bg-white text-left transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {/* Image */}
                  <div className="relative aspect-4/3 w-full bg-stone-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium text-stone-500">
                        Nessuna immagine
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1 p-3">
                    <p className="text-sm font-semibold text-black line-clamp-2">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-gray-600 line-clamp-1">{item.description}</p>
                    ) : null}
                    <p className="pt-1 text-sm font-bold text-black">{formatEuro(item.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Cart section */}
          {rows.length > 0 ? (
            <div className="space-y-3 border-t border-black pt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-black">Il tuo ordine</h3>
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={pending || submitLocked}
                  className="rounded-full border border-black px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-black hover:text-white disabled:opacity-50"
                >
                  Svuota
                </button>
              </div>

              <div className="space-y-3">
                {rows.map((row, idx) => {
                  const item = menuItemMap.get(row.menuItemId)

                  return (
                    <div
                      key={`${row.menuItemId}-${idx}`}
                      className="flex items-start gap-3 rounded-xl border border-black bg-white p-3"
                    >
                      {/* Item image */}
                      <div className="relative h-12 w-12 shrink-0 rounded-lg">
                        {item?.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-medium text-gray-500">
                            No img
                          </div>
                        )}
                      </div>

                      {/* Item info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-black">{item?.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatEuro((item?.price ?? 0) * row.quantity)}
                        </p>

                        {/* Quantity */}
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={row.quantity}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              updateRow(
                                idx,
                                'quantity',
                                Number.isFinite(val) ? Math.min(20, Math.max(1, val)) : 1,
                              )
                            }}
                            disabled={pending || submitLocked}
                            className="w-20 rounded-lg border-2 border-black bg-white px-3 py-2 text-center text-base font-semibold outline-none transition focus:border-black focus:ring-2 focus:ring-gray-300"
                          />
                          <span className="text-sm font-semibold text-black">×</span>
                        </div>

                        {/* Note */}
                        <input
                          type="text"
                          value={row.note}
                          maxLength={80}
                          onChange={(e) => updateRow(idx, 'note', e.target.value)}
                          placeholder="Es. senza panna, extra aglio..."
                          disabled={pending || submitLocked}
                          className="mt-3 w-full rounded-lg border-2 border-black bg-white px-4 py-3 text-base outline-none transition focus:border-black focus:ring-2 focus:ring-gray-300 placeholder-gray-500"
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={pending || submitLocked}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-black text-2xl font-semibold text-black transition hover:bg-red-600 hover:text-white active:bg-red-700 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Order notes */}
              <div className="space-y-3 pt-4">
                <label className="block text-base font-semibold text-black">
                  Note aggiuntive (opzionale)
                </label>
                <textarea
                  value={orderNote}
                  maxLength={200}
                  rows={3}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Es. citofono, allergie, preferenze speciali..."
                  disabled={pending || submitLocked}
                  className="w-full resize-none rounded-lg border-2 border-black bg-white px-4 py-3 text-base outline-none transition focus:border-black focus:ring-2 focus:ring-gray-300 placeholder-gray-500"
                />
              </div>
            </div>
          ) : null}

          {/* Error message */}
          {state.status === 'error' && state.message ? (
            <div className="rounded-xl border border-black bg-white p-4 text-sm text-black">
              {state.message}
            </div>
          ) : null}
        </div>
      </div>

      {/* Fixed footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black bg-white/98 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] backdrop-blur sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-stretch gap-4">
          {/* Total */}
          <div className="flex-1 rounded-xl bg-black px-4 py-3 text-white sm:px-6 sm:py-4">
            <p className="text-xs uppercase tracking-widest text-gray-400">Totale</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{formatEuro(total)}</p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={pending || submitLocked || rows.length === 0}
            className="min-w-48 flex items-center justify-center rounded-xl bg-emerald-600 px-6 text-base font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:min-w-56 sm:text-lg"
          >
            {pending || submitLocked ? 'Invio...' : 'Conferma'}
          </button>
        </div>
      </div>
    </form>
  )
}
