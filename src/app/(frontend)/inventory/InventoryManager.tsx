'use client'

import { useEffect, useMemo, useState } from 'react'

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

const parseNumericId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

export function InventoryManager({ initialMenuItems, categories }: InventoryManagerProps) {
  const ITEMS_PER_PAGE = 5

  const [menuItems, setMenuItems] = useState<InventoryItem[]>(initialMenuItems)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newItem, setNewItem] = useState<NewItemForm>(initialNewItemForm)
  const [newItemImageFile, setNewItemImageFile] = useState<File | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [savingIds, setSavingIds] = useState<number[]>([])
  const [deletingIds, setDeletingIds] = useState<number[]>([])
  const [pendingImageFiles, setPendingImageFiles] = useState<Record<number, File | null>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const hasCategories = categories.length > 0

  const filteredAndSortedItems = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLocaleLowerCase('it-IT')

    return [...menuItems]
      .filter((item) => {
        if (!normalizedQuery) return true

        const searchableText = [item.name, item.description, item.categoryName]
          .join(' ')
          .toLocaleLowerCase('it-IT')

        return searchableText.includes(normalizedQuery)
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'it-IT'))
  }, [menuItems, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE))
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedItems = filteredAndSortedItems.slice(pageStart, pageStart + ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setCurrentPage(nextPage)
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

    const mediaId =
      parseNumericId(data?.id) ?? parseNumericId(data?.doc?.id) ?? parseNumericId(data?.data?.id)
    const mediaUrl =
      (typeof data?.url === 'string' ? data.url : null) ??
      (typeof data?.doc?.url === 'string' ? data.doc.url : null) ??
      (typeof data?.data?.url === 'string' ? data.data.url : null)

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

      const response = await fetch(`/api/internal/menu-items/${item.id}`, {
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
        throw new Error(data?.message || 'Errore salvataggio prodotto')
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

      alert('Prodotto aggiornato con successo')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore salvataggio prodotto'
      alert(message)
    } finally {
      setItemSaving(item.id, false)
    }
  }

  const deleteItem = async (id: number) => {
    const confirmed = window.confirm('Eliminare definitivamente questo prodotto?')
    if (!confirmed) return

    setItemDeleting(id, true)

    try {
      const response = await fetch(`/api/internal/menu-items/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || 'Errore eliminazione prodotto')
      }

      setMenuItems((current) => current.filter((item) => item.id !== id))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore eliminazione prodotto'
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

      const response = await fetch('/api/internal/menu-items', {
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
        throw new Error(data?.message || 'Errore creazione prodotto')
      }

      setMenuItems((current) => [data.item as InventoryItem, ...current])
      setNewItem(initialNewItemForm)
      setNewItemImageFile(null)
      setIsCreateModalOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore creazione prodotto'
      alert(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <label htmlFor="inventory-search" className="mb-1 block text-sm font-semibold text-black">
            Cerca prodotti
          </label>
          <input
            id="inventory-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca per nome, descrizione o categoria"
            className="w-full rounded-xl border border-black bg-white px-4 py-3 text-base"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-black px-6 py-3 text-base font-bold text-white transition hover:bg-stone-800"
        >
          Nuovo prodotto
        </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-black bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold text-black [font-family:var(--font-title)] sm:text-3xl">
                Nuovo prodotto
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (isCreating) return
                  setIsCreateModalOpen(false)
                }}
                className="rounded-lg border border-black px-3 py-1.5 text-sm font-semibold text-black hover:bg-gray-100"
              >
                Chiudi
              </button>
            </div>

            {!hasCategories && (
              <p className="mt-3 rounded-lg border border-black bg-gray-50 p-3 text-sm text-black">
                Nessuna categoria disponibile. Crea prima una categoria dal pannello admin.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="new-item-name"
                  className="mb-1 block text-sm font-semibold text-black"
                >
                  Nome
                </label>
                <input
                  id="new-item-name"
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Nome"
                  disabled={isCreating || !hasCategories}
                  className="w-full rounded-lg border border-black px-4 py-3 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-price"
                  className="mb-1 block text-sm font-semibold text-black"
                >
                  Prezzo
                </label>
                <input
                  id="new-item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem((current) => ({ ...current, price: e.target.value }))}
                  placeholder="Prezzo"
                  disabled={isCreating || !hasCategories}
                  className="w-full rounded-lg border border-black px-4 py-3 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-category"
                  className="mb-1 block text-sm font-semibold text-black"
                >
                  Categoria
                </label>
                <select
                  id="new-item-category"
                  value={newItem.categoryId}
                  onChange={(e) =>
                    setNewItem((current) => ({ ...current, categoryId: e.target.value }))
                  }
                  disabled={isCreating || !hasCategories}
                  className="w-full rounded-lg border border-black px-4 py-3 text-base"
                >
                  <option value="">Seleziona categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="rounded-lg border border-black px-4 py-3">
                <legend className="px-1 text-sm font-semibold text-black">Disponibilita</legend>
                <label className="flex items-center gap-2 text-sm font-semibold text-black">
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
              </fieldset>

              <div className="sm:col-span-2">
                <label
                  htmlFor="new-item-description"
                  className="mb-1 block text-sm font-semibold text-black"
                >
                  Descrizione
                </label>
                <textarea
                  id="new-item-description"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem((current) => ({ ...current, description: e.target.value }))
                  }
                  placeholder="Descrizione (opzionale)"
                  disabled={isCreating || !hasCategories}
                  rows={3}
                  className="w-full rounded-lg border border-black px-4 py-3 text-base"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="new-item-image"
                  className="mb-1 block text-sm font-semibold text-black"
                >
                  Immagine prodotto
                </label>
                <input
                  id="new-item-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewItemImageFile(e.target.files?.[0] ?? null)}
                  disabled={isCreating || !hasCategories}
                  className="w-full rounded-lg border border-black px-4 py-3 text-base"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isCreating) return
                  setIsCreateModalOpen(false)
                }}
                disabled={isCreating}
                className="rounded-xl border border-black bg-white px-5 py-3 text-base font-bold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={createItem}
                disabled={isCreating || !hasCategories}
                className="rounded-xl bg-black px-5 py-3 text-base font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? 'Creazione...' : 'Aggiungi prodotto'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredAndSortedItems.length === 0 ? (
          <div className="rounded-2xl border border-black bg-white p-8 text-center text-gray-600">
            {searchTerm.trim()
              ? 'Nessun prodotto trovato per la ricerca inserita'
              : 'Nessun prodotto presente'}
          </div>
        ) : (
          paginatedItems.map((item) => {
            const isSaving = savingIds.includes(item.id)
            const isDeleting = deletingIds.includes(item.id)

            return (
              <div key={item.id} className="rounded-2xl border border-black bg-white p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label
                      htmlFor={`item-name-${item.id}`}
                      className="mb-1 block text-sm font-semibold text-black"
                    >
                      Nome
                    </label>
                    <input
                      id={`item-name-${item.id}`}
                      type="text"
                      value={item.name}
                      onChange={(e) => updateField(item.id, 'name', e.target.value)}
                      className="w-full rounded-lg border border-black px-3 py-2 text-base"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`item-price-${item.id}`}
                      className="mb-1 block text-sm font-semibold text-black"
                    >
                      Prezzo
                    </label>
                    <input
                      id={`item-price-${item.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        updateField(item.id, 'price', Number.isFinite(val) ? Math.max(0, val) : 0)
                      }}
                      className="w-full rounded-lg border border-black px-3 py-2 text-base"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`item-category-${item.id}`}
                      className="mb-1 block text-sm font-semibold text-black"
                    >
                      Categoria
                    </label>
                    <select
                      id={`item-category-${item.id}`}
                      value={item.categoryId}
                      onChange={(e) => updateField(item.id, 'categoryId', Number(e.target.value))}
                      className="w-full rounded-lg border border-black px-3 py-2 text-base"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <fieldset className="rounded-lg border border-black px-3 py-2">
                    <legend className="px-1 text-sm font-semibold text-black">Disponibilita</legend>
                    <label className="flex items-center gap-2 text-sm font-semibold text-black">
                      <input
                        type="checkbox"
                        checked={item.isAvailable}
                        onChange={(e) => updateField(item.id, 'isAvailable', e.target.checked)}
                      />
                      Disponibile
                    </label>
                  </fieldset>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label
                      htmlFor={`item-description-${item.id}`}
                      className="mb-1 block text-sm font-semibold text-black"
                    >
                      Descrizione
                    </label>
                    <textarea
                      id={`item-description-${item.id}`}
                      value={item.description}
                      onChange={(e) => updateField(item.id, 'description', e.target.value)}
                      rows={2}
                      placeholder="Descrizione"
                      className="w-full rounded-lg border border-black px-3 py-2 text-sm"
                    />
                  </div>

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

                  <div>
                    <label
                      htmlFor={`item-image-${item.id}`}
                      className="mb-1 block text-sm font-semibold text-black"
                    >
                      Immagine prodotto
                    </label>
                    <input
                      id={`item-image-${item.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPendingImageFile(item.id, e.target.files?.[0] ?? null)}
                      className="w-full rounded-lg border border-black px-3 py-2 text-sm"
                    />
                  </div>

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

        {filteredAndSortedItems.length > ITEMS_PER_PAGE && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex flex-wrap justify-center gap-2">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  className={`min-h-12 min-w-12 rounded-xl px-4 py-2 text-sm font-bold transition ${
                    currentPage === page
                      ? 'bg-black text-white'
                      : 'border border-black bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="min-h-12 rounded-xl border border-black bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Precedente
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="min-h-12 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
