import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Calendar, Stethoscope, FileText, CheckCircle, ShieldAlert } from 'lucide-react'

export default function ClientAppointmentForm() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Form States
  const [requestedDate, setRequestedDate] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [description, setDescription] = useState('')
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Fetch Client's Equipment for dropdown selection
  const { data: equipmentList, isLoading: isEqLoading } = useQuery({
    queryKey: ['client_equipment_for_form', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return []
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!profile?.client_id
  })

  // 2. Appointment Insert Mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (newAppt) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(newAppt)
        .select()
      if (error) throw error
      return data && data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_appointments'] })
    }
  })

  const todayStr = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!requestedDate) {
      setErrorMsg('Por favor seleccione una fecha para la cita.')
      return
    }
    if (requestedDate < todayStr) {
      setErrorMsg('No es posible agendar citas en fechas pasadas.')
      return
    }

    setErrorMsg('')
    setSuccess(false)

    try {
      await createAppointmentMutation.mutateAsync({
        client_id: profile.client_id,
        equipment_id: equipmentId || null,
        requested_date: requestedDate,
        description: description || null,
        status: 'pendiente'
      })
      
      setSuccess(true)
      setRequestedDate('')
      setEquipmentId('')
      setDescription('')

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/portal/citas')
      }, 2000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al solicitar la cita.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Solicitar Cita de Servicio</h2>
        <p className="text-sm text-slate-500">
          Agende una visita técnica para revisar y mantener sus equipos médicos.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-slide-up">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <span>¡Cita solicitada con éxito! Redirigiendo a sus solicitudes...</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Requested Date */}
          <div>
            <label className="custom-label flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              Fecha Solicitada *
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white text-sm"
            />
          </div>

          {/* Equipment Dropdown */}
          <div>
            <label className="custom-label flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-slate-400" />
              Dispositivo Médico Relacionado
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              disabled={isEqLoading}
              className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white text-sm cursor-pointer disabled:opacity-50"
            >
              <option value="">No estoy seguro / Agendar sin equipo específico</option>
              {equipmentList?.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} {eq.brand ? `(${eq.brand})` : ''} - S/N: {eq.serial_number || 'N/A'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Seleccione el dispositivo específico que requiere inspección, o déjelo en blanco si es una visita general.
            </p>
          </div>

          {/* Issue Description */}
          <div>
            <label className="custom-label flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-slate-400" />
              Descripción del Problema o Solicitud
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa brevemente el síntoma, falla o tipo de mantenimiento requerido..."
              rows={4}
              className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/portal/citas')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createAppointmentMutation.isPending || success}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
            >
              Solicitar Visita Técnica
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
