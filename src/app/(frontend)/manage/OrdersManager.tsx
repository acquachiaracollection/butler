'use client'

import { useState } from 'react'
import Image from 'next/image'

type MenuItem = {
  id: number
  name: string
  price: number
  imageUrl?: string | null
}

type OrderItem = {
  quantity: number
  note: string
  menuItem: MenuItem
}

type Order = {
  id: string | number
  status: 'pending' | 'preparing' | 'completed'
  items: OrderItem[]
  note: string
  createdAt: string
  updatedAt: string
  handledBy?: any
}

type OrdersManagerProps = {
  initialOrders: Order[]
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  preparing: { label: 'In preparazione', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  completed: { label: 'Completato', color: 'bg-green-100 text-green-800 border-green-300' },
}

const formatEuro = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('it-IT', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OrdersManager({ initialOrders }: OrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [expandedOrderId, setExpandedOrderId] = useState<string | number | null>(null)

  const updateOrderStatus = async (orderId: string | number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o)),
        )
      } else {
        const errorData = await response.json()
        console.error("Errore nell'aggiornamento:", response.status, errorData)
        alert(`Errore: ${errorData.message || "Impossibile aggiornare l'ordine"}`)
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento dello status:", error)
      alert("Errore di connessione nell'aggiornamento dell'ordine")
    }
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const preparingOrders = orders.filter((o) => o.status === 'preparing')
  const completedOrders = orders.filter((o) => o.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-yellow-800">
            In attesa
          </p>
          <p className="mt-2 text-3xl font-bold text-yellow-900 sm:text-4xl">
            {pendingOrders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-300 bg-blue-50 p-4 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-800">
            In preparazione
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-900 sm:text-4xl">
            {preparingOrders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-800">
            Completati
          </p>
          <p className="mt-2 text-3xl font-bold text-green-900 sm:text-4xl">
            {completedOrders.length}
          </p>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-black bg-white p-8 text-center text-gray-600">
            Nessun ordine ricevuto
          </div>
        ) : (
          orders.map((order) => {
            const total = order.items.reduce(
              (sum, item) => sum + (item.menuItem?.price ?? 0) * item.quantity,
              0,
            )
            const isExpanded = expandedOrderId === order.id

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-black bg-white"
              >
                {/* Order header */}
                <button
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="w-full bg-white p-4 text-left transition hover:bg-gray-50 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-600">
                          Ordine #{order.id}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusLabels[order.status].color}`}
                        >
                          {statusLabels[order.status].label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {formatDate(order.createdAt)} • {order.items.length} articoli •{' '}
                        <span className="font-semibold text-black">{formatEuro(total)}</span>
                      </p>
                    </div>
                    <div className="text-2xl text-gray-400">{isExpanded ? '−' : '+'}</div>
                  </div>
                </button>

                {/* Order details */}
                {isExpanded && (
                  <div className="border-t border-black bg-gray-50 p-4 sm:p-6">
                    {/* Items */}
                    <div className="mb-6 space-y-3">
                      <h3 className="font-semibold text-black">Articoli:</h3>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 rounded-lg bg-white p-3">
                          {item.menuItem?.imageUrl && (
                            <div className="relative h-12 w-12 shrink-0 rounded">
                              <Image
                                src={item.menuItem.imageUrl}
                                alt={item.menuItem.name}
                                fill
                                sizes="48px"
                                className="object-contain"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-black">{item.menuItem?.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity}× {formatEuro(item.menuItem?.price ?? 0)}
                            </p>
                            {item.note && (
                              <p className="mt-1 text-xs text-gray-600 italic">Nota: {item.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order note */}
                    {order.note && (
                      <div className="mb-6 rounded-lg bg-white p-3">
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          Note ordine:
                        </p>
                        <p className="mt-1 text-sm text-gray-800">{order.note}</p>
                      </div>
                    )}

                    {/* Status selector */}
                    <div className="flex flex-col gap-3 border-t border-black pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <label className="block text-sm font-semibold text-black">
                          Cambia status:
                        </label>
                        <div className="mt-2 flex gap-2">
                          {Object.entries(statusLabels).map(([statusValue, { label }]) => (
                            <button
                              key={statusValue}
                              onClick={() => updateOrderStatus(order.id, statusValue)}
                              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                order.status === statusValue
                                  ? 'bg-black text-white'
                                  : 'border border-black bg-white text-black hover:bg-gray-100'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Totale: <span className="font-bold text-black">{formatEuro(total)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
