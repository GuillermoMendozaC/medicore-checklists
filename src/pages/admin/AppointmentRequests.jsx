import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Stethoscope, 
  Save, 
  SlidersHorizontal,
  Info
} from 'lucide-react'

export default function AppointmentRequests() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pendiente')

  // Edit/Assign State
  const [editingId, setEditingId] = useState(null)
  const [techId, setTechId] = useState('')
  const [confirmedDate, setConfirmedDate] = useState('')
  const [localError, setLocalError] = useState('')

  // 1. Fetch Appointments
  const { data: appointments, isLoading: isApptsLoading, isError, error } = useQuery({
    queryKey: ['admin_appointments', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, client:clients(*), equipment:equipment(*), technician:profiles(*)')
      
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // 2. Fetch Technicians for Dropdown Selector
  const { data: technicians } = useQuery({
    queryKey: ['profiles_technicians_only'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tecnico')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data
    }
  })

  // 3. Mutation to Assign Technician
  const assignAppointmentMutation = useMutation({
    mutationFn: async ({ id, technician_id, confirmed_date }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'asignada',
          assigned_technician_id: technician_id,
          confirmed_date
        })
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data && data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_appointments'] })
    }
  })

  const todayStr = new Date().toISOString().split('T')[0]

  const handleStartAssign = (appt) => {
    setEditingId(appt.id)
    setTechId(appt.assigned_technician_id || '')
    setConfirmedDate(appt.confirmed_date || appt.requested_date || '')
    setLocalError('')
  }

  const handleSaveAssignment = async (apptId) => {
    if (!techId) {
      setLocalError('Debe seleccionar un técnico.')
      return
    }
    if (!confirmedDate) {
      setLocalError('Debe definir una fecha confirmada.')
      return
    }
    if (confirmedDate < todayStr) {
      setLocalError('La fecha de confirmación no puede ser en el pasado.')
      return
    }

    setLocalError('')
    try {
      await assignAppointmentMutation.mutateAsync({
        id: apptId,
        technician_id: techId,
        confirmed_date: confirmedDate
      })
      setEditingId(null)
    } catch (err) {
      setLocalError(err.message || 'Error al asignar la cita.')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 w-fit">
            <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            Pendiente
          </span>
        )
      case 'asignada':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 w-fit">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            Asignada
          </span>
        )
      case 'completada':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Completada
          </span>
        )
      case 'cancelada':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 w-fit">
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            Cancelada
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Citas y Visitas de Servicio</h2>
          <p className="text-sm text-slate-500">
            Gestione y asigne técnicos a las visitas solicitadas por los clientes externos.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border w-fit text-xs font-bold">
          {['todo', 'pendiente', 'asignada', 'completada', 'cancelada'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status === 'todo' ? '' : status)
                setEditingId(null)
              }}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all duration-200 ${
                (statusFilter === '' && status === 'todo') || statusFilter === status
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm border border-slate-205/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {localError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {isApptsLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-rose-500 bg-white dark:bg-slate-900 border rounded-2xl">
          Error al cargar citas: {error.message}
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 text-center text-slate-500 shadow-sm">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-450" />
          No se encontraron solicitudes de cita con este estado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {appointments.map((appt) => {
            const isEditing = editingId === appt.id
            return (
              <div 
                key={appt.id} 
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    {getStatusBadge(appt.status)}
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID Cita: {appt.id.slice(0, 8)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-850 dark:text-white text-base leading-tight">
                      {appt.equipment ? appt.equipment.name : 'Solicitud General'}
                    </h3>
                    <div className="flex flex-col gap-1.5 mt-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-slate-400" />
                        Clínica: {appt.client?.name || 'Cliente Desconocido'}
                      </span>
                      {appt.equipment && (
                        <span className="text-[11px] text-slate-450 font-semibold flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                          Serie: {appt.equipment.serial_number || 'N/A'} • Ubicación: {appt.equipment.location || 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>

                  {appt.description && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-600 dark:text-slate-350 leading-normal italic">
                      "{appt.description}"
                    </div>
                  )}

                  {isEditing ? (
                    <div className="p-4 bg-indigo-50/30 dark:bg-slate-850/40 border border-dashed rounded-2xl space-y-4 animate-slide-up">
                      <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider">Asignación Técnica</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-450 mb-1">Técnico Responsable *</label>
                          <select
                            value={techId}
                            onChange={(e) => setTechId(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none focus:border-indigo-500 cursor-pointer dark:text-white"
                          >
                            <option value="">Seleccionar técnico...</option>
                            {technicians?.map(t => (
                              <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-450 mb-1">Fecha Confirmada *</label>
                          <input
                            type="date"
                            min={todayStr}
                            value={confirmedDate}
                            onChange={(e) => setConfirmedDate(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none focus:border-indigo-500 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveAssignment(appt.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Confirmar Asignación
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-400 font-medium">Fecha Preferente</span>
                        <span className="font-bold text-slate-700 dark:text-slate-350">{appt.requested_date}</span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-400 font-medium">Fecha Asignada</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {appt.confirmed_date || <span className="text-slate-450 font-normal italic">Sin programar</span>}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      {appt.assigned_technician_id ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <span className="text-slate-400 font-medium">Responsable:</span>
                          <span className="font-semibold bg-indigo-50/50 dark:bg-slate-800/40 py-0.5 px-2 rounded flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-450" />
                            {appt.technician?.full_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 py-0.5 px-2.5 rounded border border-amber-100 dark:border-amber-900/30">
                          Requiere asignación
                        </span>
                      )}
                    </div>

                    {appt.status === 'pendiente' && (
                      <button
                        onClick={() => handleStartAssign(appt)}
                        className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                      >
                        Asignar Técnico
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
