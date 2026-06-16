import React, { useState } from 'react'
import { useEquipment } from '../hooks/useEquipment'
import { FolderHeart, Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react'

export default function CategoryList() {
  const { 
    useCategories, 
    useCreateCategory, 
    useUpdateCategory, 
    useDeleteCategory 
  } = useEquipment()

  const { data: categories, isLoading, isError, error } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [newCatName, setNewCatName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [localError, setLocalError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setLocalError('')
    try {
      await createMutation.mutateAsync(newCatName)
      setNewCatName('')
    } catch (err) {
      setLocalError(err.message || 'Error al crear la categoría')
    }
  }

  const handleStartEdit = (cat) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
    setLocalError('')
  }

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return
    setLocalError('')
    try {
      await updateMutation.mutateAsync({ id, name: editingName })
      setEditingId(null)
    } catch (err) {
      setLocalError(err.message || 'Error al actualizar la categoría')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta categoría? Si tiene equipos asociados, podría dar error en base de datos debido a restricciones de integridad (FK).')) {
      return
    }
    setLocalError('')
    try {
      await deleteMutation.mutateAsync(id)
    } catch (err) {
      setLocalError(err.message || 'Error al eliminar. Verifique que no existan equipos asociados.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Categorías de Equipamiento</h2>
          <p className="text-sm text-slate-500">Administración de agrupadores de dispositivos médicos</p>
        </div>
      </div>

      {localError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Create Form */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <FolderHeart className="h-4.5 w-4.5 text-indigo-500" />
            Nueva Categoría
          </h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="custom-label">Nombre de Categoría *</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej: Autoclaves, Monitores..."
                className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              {createMutation.isLoading ? 'Agregando...' : 'Agregar Categoría'}
            </button>
          </form>
        </div>

        {/* Categories Table */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-rose-500">
              Error al cargar categorías: {error.message}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No hay categorías creadas todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Nombre</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-5 font-semibold text-slate-700 dark:text-slate-350">
                        {editingId === cat.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                          />
                        ) : (
                          cat.name
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {editingId === cat.id ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdate(cat.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                              title="Confirmar"
                            >
                              <Check className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Cancelar"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(cat)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
