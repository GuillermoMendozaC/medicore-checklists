import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { Calendar, Plus, Stethoscope, User, Clock, Info, CheckCircle2, FileDown } from 'lucide-react'
import { exportChecklistToPdf } from '../../lib/exportPdf'

export default function ClientAppointmentList() {
  const { profile } = useAuth()

  // Fetch Client's Appointments
  const { data: appointments, isLoading, isError, error } = useQuery({
    queryKey: ['client_appointments', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return []
      const { data, error } = await supabase
        .from('appointments')
        .select('*, equipment:equipment(*), technician:profiles(*)')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!profile?.client_id
  })

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
            Fecha Confirmada
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
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
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
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Citas y Visitas Técnicas</h2>
          <p className="text-sm text-slate-500">
            Supervise el estado de sus solicitudes de servicio e inspección técnica.
          </p>
        </div>
        <Link
          to="/portal/citas/nueva"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto text-sm"
        >
          <Plus className="h-4.5 w-4.5" />
          Solicitar Cita
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-rose-500 bg-white dark:bg-slate-900 border rounded-2xl">
          Error al cargar sus citas: {error.message}
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 text-center text-slate-500 shadow-sm">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-450" />
          No tiene solicitudes de cita técnica vigentes.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Appointment Card with PDF download ──────────────────────────────────────
function AppointmentCard({ appt, getStatusBadge }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleDownloadPDF = async () => {
    setIsExporting(true)
    try {
      // 1. Find the linked completed checklist for this appointment
      const { data: checklists, error: chkError } = await supabase
        .from('maintenance_checklists')
        .select('*, equipment:equipment(*), template:checklist_templates(*), technician:profiles(*)')
        .eq('appointment_id', appt.id)
        .eq('status', 'completado')
        .order('completed_at', { ascending: false })
        .limit(1)

      if (chkError) throw chkError

      if (!checklists || checklists.length === 0) {
        alert('No se encontró el reporte de inspección vinculado a esta cita. El técnico podría no haber subido el checklist aún.')
        return
      }

      const chk = checklists[0]

      // 2. Fetch responses for this checklist
      const { data: responses, error: respError } = await supabase
        .from('checklist_responses')
        .select('*, template_item:checklist_template_items(*)')
        .eq('checklist_id', chk.id)

      if (respError) throw respError

      // 3. Generate and download the PDF
      await exportChecklistToPdf(chk, responses || [])
    } catch (err) {
      console.error('Error descargando PDF:', err)
      alert('Error al generar el reporte PDF: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 border ${
        appt.status === 'completada'
          ? 'border-emerald-100 dark:border-emerald-950/40'
          : 'border-slate-100 dark:border-slate-800'
      }`}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          {getStatusBadge(appt.status)}
          <span className="text-[10px] text-slate-400 font-mono">
            ID Cita: <span>{appt.id.slice(0, 8)}</span>
          </span>
        </div>

        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-base leading-tight">
            {appt.equipment ? appt.equipment.name : 'Inspección de Equipos General'}
          </h4>
          {appt.equipment && (
            <span className="text-[11px] text-slate-450 font-semibold flex items-center gap-1.5 mt-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-slate-405" />
              S/N: {appt.equipment.serial_number || 'N/A'} • Ubicación: {appt.equipment.location || 'N/A'}
            </span>
          )}
        </div>

        {appt.description && (
          <p className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-600 dark:text-slate-350 leading-normal italic">
            "{appt.description}"
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400 font-medium">Fecha Preferente</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{appt.requested_date}</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400 font-medium">Fecha Confirmada</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {appt.confirmed_date || <span className="text-slate-400 font-normal italic">Por confirmar</span>}
            </span>
          </div>
        </div>
      </div>

      {appt.assigned_technician_id && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2 flex-wrap">
          <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-indigo-50/50 dark:bg-slate-800 py-1 px-2.5 rounded-lg border border-indigo-100/10">
            <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            {appt.technician?.full_name || 'Técnico Asignado'}
          </span>

          {appt.status === 'completada' && (
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold text-xs transition-colors disabled:opacity-60"
            >
              {isExporting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              {isExporting ? 'Generando...' : 'Descargar PDF'}
            </button>
          )}
        </div>
      )}

      {/* Full-width download button for completed appointments without technician shown */}
      {appt.status === 'completada' && !appt.assigned_technician_id && (
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          {isExporting ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generando PDF...</>
          ) : (
            <><FileDown className="h-4 w-4" /> Descargar Reporte de Inspección (PDF)</>
          )}
        </button>
      )}
    </div>
  )
}
