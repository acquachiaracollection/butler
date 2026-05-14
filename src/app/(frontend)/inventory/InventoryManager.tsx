'use client'

import { useMemo, useState } from 'react'

type Category = {
  id: number
  name: string
}

type InventoryItem = {
  id: number
  name: string
  description: string
  price: number
  isAvailable: boolean
  imageId: number | null
  imageUrl: string | null
  categoryId: number
  categoryName: string
}

type InventoryManagerProps = {
  initialMenuItems: InventoryItem[]
  categories: Category[]
}

type NewItemForm = {
  name: string
  description: string
  price: string
  categoryId: string
  isAvailable: boolean
}

const initialNewItemForm: NewItemForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  isAvailable: true,
}

const formatEuro = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function InventoryManager({ initialMenuItems, categories }: InventoryManagerProps) {
  const [menuItems, setMenuItems] = useState<InventoryItem[]>(initialMenuItems)
  const [newItem, setNewItem] = useState<NewItemForm>(initialNewItemForm)
  const [newItemImageFile, setNewItemImageFile] = useState<File | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [savingIds, setSavingIds] = useState<number[]>([])
  const [deletingIds, setDeletingIds] = useState<number[]>([])
  const [pendingImageFiles, setPendingImageFiles] = useState<Record<number, File | null>>({})

  const hasCategories = categories.length > 0

  const sortedItems = useMemo(() => {
    return [...menuItems].sort((a, b) => a.name.localeCompare(b.name, 'it-IT'))
  }, [menuItems])

  const setItemSaving = (id: number, value: boolean) => {
    setSavingIds((current) =>
      value ? (current.includes(id) ? current : [...current, id]) : current.filter((x) => x !== id),
    )
  }

  const setItemDeleting = (id: number, value: boolean) => {
    setDeletingIds((current) =>
      value ? (current.includes(id) ? current : [...current, id]) : current.filter((x) => x !== id),
    )
  }

  const updateField = <K extends keyof InventoryItem>(
    id: number,
    key: K,
    value: InventoryItem[K],
  ) => {
    setMenuItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    )
  }

  const setPendingImageFile = (id: number, file: File | null) => {
    setPendingImageFiles((current) => ({ ...current, [id]: file }))
  }

  const uploadMedia = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.message || 'Errore upload immagine')
    }

    const mediaId = typeof data?.id === 'number' ? data.id : null
    const mediaUrl = typeof data?.url === 'string' ? data.url : null

    if (!mediaId) {
      throw new Error('Upload immagine non valido')
    }

    return { mediaId, mediaUrl }
  }

  const saveItem = async (item: InventoryItem) => {
    setItemSaving(item.id, true)

    try {
      let imagePatch: { image?: number } = {}
      const nextFile = pendingImageFiles[item.id]
      if (nextFile) {
        const uploaded = await uploadMedia(nextFile)
        imagePatch = { image: uploaded.mediaId }
      }

      const response = await fetch(`/api/menu-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.categoryId,
          isAvailable: item.isAvailable,
          ...imagePatch,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Errore salvataggio menu item')
      }

      if (data?.item) {
        setMenuItems((current) =>
          current.map((currentItem) =>
            currentItem.id === item.id
              ? { ...currentItem, ...(data.item as InventoryItem) }
              : currentItem,
          ),
        )
      }

      setPendingImageFile(item.id, null)

      alert('Menu item aggiornato con successo')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore salvataggio menu item'
      alert(message)
    } finally {
      setItemSaving(item.id, false)
    }
  }

  const deleteItem = async (id: number) => {
    const confirmed = window.confirm('Eliminare definitivamente questo menu item?')
    if (!confirmed) return

    setItemDeleting(id, true)

    try {
      const response = await fetch(`/api/menu-items/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || 'Errore eliminazione menu item')
      }

      setMenuItems((current) => current.filter((item) => item.id !== id))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore eliminazione menu item'
      alert(message)
    } finally {
      setItemDeleting(id, false)
    }
  }

  const createItem = async () => {
    if (!newItem.name.trim()) {
      alert('Il nome e obbligatorio')
      return
    }

    const parsedPrice = Number(newItem.price)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      alert('Prezzo non valido')
      return
    }

    const parsedCategoryId = Number(newItem.categoryId)
    if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
      alert('Seleziona una categoria valida')
      return
    }

    setIsCreating(true)

    try {
      let image: number | null = null
      if (newItemImageFile) {
        const uploaded = await uploadMedia(newItemImageFile)
        image = uploaded.mediaId
      }

      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name.trim(),
          description: newItem.description.trim(),
          price: parsedPrice,
          category: parsedCategoryId,
          isAvailable: newItem.isAvailable,
          ...(image ? { image } : {}),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.item) {
        throw new Error(data?.message || 'Errore creazione menu item')
      }

      setMenuItems((current) => [data.item as InventoryItem, ...current])
      setNewItem(initialNewItemForm)
      setNewItemImageFile(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore creazione menu item'
      alert(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black bg-white p-5 sm:p-6">
        <h2 className="text-2xl font-semibold text-black [font-family:var(--font-title)] sm:text-3xl">
          Nuovo menu item
        </h2>

        {!hasCategories && (
          <p className="mt-3 rounded-lg border border-black bg-gray-50 p-3 text-sm text-black">
            Nessuna categoria disponibile. Crea prima una categoria dal pannello admin.
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem((current) => ({ ...current, name: e.target.value }))}
            placeholder="Nome"
            disabled={isCreating || !hasCategories}
            className="rounded-lg border border-black px-4 py-3 text-base"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={newItem.price}
            onChange={(e) => setNewItem((current) => ({ ...current, price: e.target.value }))}
            placeholder="Prezzo"
            disabled={isCreating || !hasCategories}
            className="rounded-lg border border-black px-4 py-3 text-base"
          />

          <select
            value={newItem.categoryId}
            onChange={(e) => setNewItem((current) => ({ ...current, categoryId: e.target.value }))}
            disabled={isCreating || !hasCategories}
            className="rounded-lg border border-black px-4 py-3 text-base"
          >
            <option value="">Seleziona categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-black px-4 py-3 text-sm font-semibold text-black">
            <input
              type="checkbox"
              checked={newItem.isAvailable}
              onChange={(e) =>
                setNewItem((current) => ({ ...current, isAvailable: e.target.checked }))
              }
              disabled={isCreating || !hasCategories}
            />
            Disponibile
          </label>

          <textarea
            value={newItem.description}
            onChange={(e) => setNewItem((current) => ({ ...current, description: e.target.value }))}
            placeholder="Descrizione (opzionale)"
            disabled={isCreating || !hasCategories}
            rows={3}
            className="sm:col-span-2 rounded-lg border border-black px-4 py-3 text-base"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewItemImageFile(e.target.files?.[0] ?? null)}
            disabled={isCreating || !hasCategories}
            className="rounded-lg border border-black px-4 py-3 text-base"
          />
        </div>

        <button
          type="button"
          onClick={createItem}
          disabled={isCreating || !hasCategories}
          className="mt-4 rounded-xl bg-black px-6 py-3 text-base font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? 'Creazione...' : 'Aggiungi menu item'}
        </button>
      </div>

      <div className="space-y-4">
        {sortedItems.length === 0 ? (
          <div className="rounded-2xl border border-black bg-white p-8 text-center text-gray-600">
            Nessun menu item presente
          </div>
        ) : (
          sortedItems.map((item) => {
            const isSaving = savingIds.includes(item.id)
            const isDeleting = deletingIds.includes(item.id)

            return (
              <div key={item.id} className="rounded-2xl border border-black bg-white p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateField(item.id, 'name', e.target.value)}
                    className="rounded-lg border border-black px-3 py-2 text-base"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      updateField(item.id, 'price', Number.isFinite(val) ? Math.max(0, val) : 0)
                    }}
                    className="rounded-lg border border-black px-3 py-2 text-base"
                  />

                  <select
                    value={item.categoryId}
                    onChange={(e) => updateField(item.id, 'categoryId', Number(e.target.value))}
                    className="rounded-lg border border-black px-3 py-2 text-base"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 rounded-lg border border-black px-3 py-2 text-sm font-semibold text-black">
                    <input
                      type="checkbox"
                      checked={item.isAvailable}
                      onChange={(e) => updateField(item.id, 'isAvailable', e.target.checked)}
                    />
                    Disponibile
                  </label>

                  <textarea
                    value={item.description}
                    onChange={(e) => updateField(item.id, 'description', e.target.value)}
                    rows={2}
                    placeholder="Descrizione"
                    className="sm:col-span-2 lg:col-span-4 rounded-lg border border-black px-3 py-2 text-sm"
                  />

                  {item.imageUrl ? (
                    <div className="sm:col-span-2 lg:col-span-1 rounded-lg border border-black bg-gray-50 p-2">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-24 w-full rounded object-contain"
                      />
                    </div>
                  ) : (
                    <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-center rounded-lg border border-dashed border-black bg-gray-50 p-2 text-sm text-gray-600">
                      Nessuna immagine
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPendingImageFile(item.id, e.target.files?.[0] ?? null)}
                    className="rounded-lg border border-black px-3 py-2 text-sm"
                  />

                  {pendingImageFiles[item.id] ? (
                    <p className="text-xs font-semibold text-gray-700">
                      Nuova immagine pronta: {pendingImageFiles[item.id]?.name}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-black pt-3">
                  <p className="text-sm text-gray-600">
                    Prezzo attuale:{' '}
                    <span className="font-semibold text-black">{formatEuro(item.price)}</span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveItem(item)}
                      disabled={isSaving || isDeleting}
                      className="rounded-xl border border-black bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? 'Salvataggio...' : 'Salva'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      disabled={isSaving || isDeleting}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? 'Eliminazione...' : 'Elimina'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
