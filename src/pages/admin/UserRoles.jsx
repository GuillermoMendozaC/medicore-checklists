import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { UserCheck, Shield, PenTool, Building, Check, X, ShieldAlert, Users } from 'lucide-react'

export default function UserRoles() {
  const queryClient = useQueryClient()

  // Queries
  const { data: profiles, isLoading: isProfilesLoading, isError: isProfilesError, error: profilesError } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, client:clients(*)')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const { data: clients, isLoading: isClientsLoading } = useQuery({
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

  // Mutation to update role
  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileId, role, client_id }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role,
          client_id: role === 'cliente' ? client_id : null
        })
        .eq('id', profileId)
        .select()
      if (error) throw error
      return data && data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    }
  })

  // Local editing states
  const [editingId, setEditingId] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [localError, setLocalError] = useState('')

  const handleStartEdit = (prof) => {
    setEditingId(prof.id)
    setSelectedRole(prof.role || 'tecnico')
    setSelectedClientId(prof.client_id || '')
    setLocalError('')
  }

  const handleSave = async (profileId) => {
    if (selectedRole === 'cliente' && !selectedClientId) {
      setLocalError('Debe asociar un cliente para las cuentas con rol de cliente.')
      return
    }

    setLocalError('')
    try {
      await updateProfileMutation.mutateAsync({
        profileId,
        role: selectedRole,
        client_id: selectedClientId || null
      })
      setEditingId(null)
    } catch (err) {
      setLocalError(err.message || 'Error al actualizar el perfil.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Roles de Usuario</h2>
        <p className="text-sm text-slate-500">
          Asigne roles organizacionales y vincule usuarios a clínicas cliente.
        </p>
      </div>

      {localError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {isProfilesLoading || isClientsLoading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : isProfilesError ? (
          <div className="p-8 text-center text-rose-500">
            Error al cargar perfiles: {profilesError.message}
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No hay perfiles registrados en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Nombre de Usuario</th>
                  <th className="py-3.5 px-5">Rol Actual</th>
                  <th className="py-3.5 px-5">Cliente Asociado (Propietario)</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {profiles.map((prof) => {
                  const isEditing = editingId === prof.id
                  return (
                    <tr key={prof.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-5 font-semibold text-slate-700 dark:text-slate-200">
                        {prof.full_name}
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{prof.id}</span>
                      </td>
                      <td className="py-4 px-5">
                        {isEditing ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => {
                              setSelectedRole(e.target.value)
                              if (e.target.value !== 'cliente') {
                                setSelectedClientId('')
                              }
                            }}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 cursor-pointer text-xs"
                          >
                            <option value="admin">Administrador</option>
                            <option value="tecnico">Técnico</option>
                            <option value="cliente">Cliente</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            prof.role === 'admin' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : prof.role === 'tecnico'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {prof.role === 'admin' ? (
                              <Shield className="h-3 w-3" />
                            ) : prof.role === 'tecnico' ? (
                              <PenTool className="h-3 w-3" />
                            ) : (
                              <Building className="h-3 w-3" />
                            )}
                            <span className="capitalize">{prof.role || 'Sin rol'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-605 dark:text-slate-400">
                        {isEditing ? (
                          selectedRole === 'cliente' ? (
                            <select
                              value={selectedClientId}
                              onChange={(e) => setSelectedClientId(e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 cursor-pointer text-xs w-full max-w-[200px]"
                            >
                              <option value="">-- Seleccionar clínica --</option>
                              {clients?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-400 italic">No aplica</span>
                          )
                        ) : (
                          prof.role === 'cliente' ? (
                            prof.client ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-350">{prof.client.name}</span>
                            ) : (
                              <span className="text-rose-500 font-bold">¡Falta Vincular Cliente!</span>
                            )
                          ) : (
                            <span className="text-slate-400 italic">No aplica</span>
                          )
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleSave(prof.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                              title="Guardar"
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
                          <button
                            onClick={() => handleStartEdit(prof)}
                            className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-indigo-650 dark:text-indigo-400 rounded-lg transition-colors"
                          >
                            Asignar Rol / Cliente
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
