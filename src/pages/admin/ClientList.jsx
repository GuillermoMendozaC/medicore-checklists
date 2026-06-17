import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Users, Plus, Edit2, Trash2, Check, X, ShieldAlert, Mail, Phone, Building } from 'lucide-react'

export default function ClientList() {
  const queryClient = useQueryClient()

  // Queries & Mutations
  const { data: clients, isLoading, isError, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (newClient) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(newClient)
        .select()
      if (error) throw error
      return data && data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
      if (error) throw error
      return data && data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })

  // Local Form States
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingEmail, setEditingEmail] = useState('')
  const [editingPhone, setEditingPhone] = useState('')
  const [localError, setLocalError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLocalError('')
    try {
      await createMutation.mutateAsync({
        name,
        contact_email: email || null,
        contact_phone: phone || null
      })
      setName('')
      setEmail('')
      setPhone('')
    } catch (err) {
      setLocalError(err.message || 'Error al crear el cliente.')
    }
  }

  const handleStartEdit = (client) => {
    setEditingId(client.id)
    setEditingName(client.name)
    setEditingEmail(client.contact_email || '')
    setEditingPhone(client.contact_phone || '')
    setLocalError('')
  }

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return
    setLocalError('')
    try {
      await updateMutation.mutateAsync({
        id,
        updates: {
          name: editingName,
          contact_email: editingEmail || null,
          contact_phone: editingPhone || null
        }
      })
      setEditingId(null)
    } catch (err) {
      setLocalError(err.message || 'Error al actualizar el cliente.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cliente? Esto podría fallar si tiene perfiles o equipos asociados.')) {
      return
    }
    setLocalError('')
    try {
      await deleteMutation.mutateAsync(id)
    } catch (err) {
      setLocalError(err.message || 'Error al eliminar cliente. Asegúrese de que no tenga equipos ni usuarios asociados.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Clientes (Empresas/Clínicas)</h2>
          <p className="text-sm text-slate-500">Gestión de clínicas y entidades externas que poseen equipos registrados.</p>
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
            <Building className="h-4.5 w-4.5 text-indigo-500" />
            Nuevo Cliente
          </h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="custom-label">Nombre del Cliente / Clínica *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Clínica Santa María"
                className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="custom-label">Email de Contacto</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@clinica.com"
                className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="custom-label">Teléfono de Contacto</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              {createMutation.isPending ? 'Creando...' : 'Crear Cliente'}
            </button>
          </form>
        </div>

        {/* Clients Table */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-rose-500">
              Error al cargar clientes: {error.message}
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No hay clientes registrados en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Nombre</th>
                    <th className="py-3.5 px-5">Email</th>
                    <th className="py-3.5 px-5">Teléfono</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-5 font-semibold text-slate-700 dark:text-slate-350">
                        {editingId === client.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                          />
                        ) : (
                          client.name
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                        {editingId === client.id ? (
                          <input
                            type="email"
                            value={editingEmail}
                            onChange={(e) => setEditingEmail(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                          />
                        ) : (
                          client.contact_email ? (
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {client.contact_email}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No especificado</span>
                          )
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                        {editingId === client.id ? (
                          <input
                            type="text"
                            value={editingPhone}
                            onChange={(e) => setEditingPhone(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                          />
                        ) : (
                          client.contact_phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {client.contact_phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No especificado</span>
                          )
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {editingId === client.id ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdate(client.id)}
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
                              onClick={() => handleStartEdit(client)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
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
