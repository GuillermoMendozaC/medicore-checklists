import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { exportChecklistToPdf } from '../../lib/exportPdf'
import { 
  ArrowLeft, 
  Stethoscope, 
  Calendar, 
  User, 
  FileDown, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Clock
} from 'lucide-react'

// Sub-component to render responses for a checklist (similar to ChecklistHistory)
function ResponsesList({ checklistId }) {
  const { data: responses, isLoading, isError } = useQuery({
    queryKey: ['client_responses', checklistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_responses')
        .select('*, template_item:checklist_template_items(*)')
        .eq('checklist_id', checklistId)
      if (error) throw error
      return data
    },
    enabled: !!checklistId
  })

  if (isLoading) {
    return (
      <div className="py-3 flex justify-center items-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  if (isError) {
    return <p className="text-xs text-rose-500 py-2">Error al cargar respuestas.</p>
  }

  if (!responses || responses.length === 0) {
    return <p className="text-xs text-slate-400 py-2">No hay respuestas registradas.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
      {responses.map((resp) => (
        <div key={resp.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs flex flex-col justify-between gap-1.5">
          <div className="flex justify-between items-start gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {resp.template_item?.label || 'Ítem'}
            </span>
            {resp.template_item?.item_type === 'boolean' ? (
              resp.value === 'true' ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">PASA</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100">FALLA</span>
              )
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                {resp.value}
              </span>
            )}
          </div>
          {resp.notes && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              Nota: {resp.notes}
            </p>
          )}
          {resp.photo_url && (
            <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-850 bg-slate-100 dark:bg-slate-950 max-w-[200px] shadow-sm">
              <img 
                src={resp.photo_url} 
                alt="Evidencia" 
                className="max-h-[120px] w-full object-cover select-none"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ClientEquipmentHistory() {
  const { id } = useParams()
  const { profile } = useAuth()
  
  const [expandedId, setExpandedId] = useState(null)
  const [isExporting, setIsExporting] = useState(null)

  // 1. Fetch Equipment Details
  const { data: equipment, isLoading: isEqLoading } = useQuery({
    queryKey: ['client_equipment_detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*, category:equipment_categories(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id
  })

  // 2. Fetch Completed Checklists
  const { data: checklists, isLoading: isChksLoading, isError, error } = useQuery({
    queryKey: ['client_equipment_checklists', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_checklists')
        .select('*, template:checklist_templates(*), technician:profiles(*)')
        .eq('equipment_id', id)
        .eq('status', 'completado')
        .order('completed_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!id
  })

  const toggleExpand = (chkId) => {
    setExpandedId(expandedId === chkId ? null : chkId)
  }

  const handleExportPDF = async (chk) => {
    setIsExporting(chk.id)
    try {
      // 1. Fetch responses for this checklist
      const { data: responses, error } = await supabase
        .from('checklist_responses')
        .select('*, template_item:checklist_template_items(*)')
        .eq('checklist_id', chk.id)
      
      if (error) throw error

      // Enriched object for PDF generation
      const enrichedChk = {
        ...chk,
        equipment: {
          name: equipment?.name,
          brand: equipment?.brand,
          model: equipment?.model,
          serial_number: equipment?.serial_number,
          location: equipment?.location,
          status: equipment?.status
        }
      }

      // 2. Export PDF
      await exportChecklistToPdf(enrichedChk, responses || [])
    } catch (err) {
      console.error("Error exporting PDF:", err)
      alert("Error al exportar el reporte a PDF: " + err.message)
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          to="/portal/equipos"
          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-650 transition-colors"
          title="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Historial de Mantenimientos</h2>
          <p className="text-sm text-slate-500">
            {isEqLoading ? 'Cargando información del equipo...' : `Historial para ${equipment?.name}`}
          </p>
        </div>
      </div>

      {/* Equipment Header Info Box */}
      {equipment && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md space-y-3 relative overflow-hidden">
          <Stethoscope className="absolute right-0 bottom-0 -mr-6 -mb-6 h-28 w-28 text-white/5 pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] bg-indigo-600/50 text-indigo-200 font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/20">
                Detalles del Dispositivo
              </span>
              <h3 className="text-xl font-bold mt-1.5">{equipment.name}</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              S/N: {equipment.serial_number || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-slate-400">Marca / Modelo</span>
              <span className="font-semibold">{equipment.brand || 'N/A'} / {equipment.model || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400">Categoría</span>
              <span className="font-semibold">{equipment.category?.name || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400">Ubicación Física</span>
              <span className="font-semibold">{equipment.location || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400">Estado</span>
              <span className="font-semibold capitalize">{equipment.status === 'activo' ? 'Operativo' : (equipment.status === 'inactivo' ? 'Inactivo' : 'En Mantención')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Checklists Timeline */}
      {isChksLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-rose-500 bg-white dark:bg-slate-900 border rounded-2xl">
          Error al cargar historial: {error.message}
        </div>
      ) : checklists?.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 text-center text-slate-500">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-450" />
          No se registran inspecciones de mantenimiento finalizadas para este equipo.
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((chk) => {
            const isExpanded = expandedId === chk.id
            return (
              <div 
                key={chk.id} 
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-base leading-tight">
                        {chk.template?.name || 'Inspección de Mantenimiento'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Frecuencia: <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{chk.template?.frequency || 'Unica'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex flex-col text-slate-500">
                      <span className="text-[10px] text-slate-450 uppercase font-semibold">Técnico Responsable</span>
                      <span className="font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <User className="h-3 w-3 text-slate-400" />
                        {chk.technician?.full_name || 'Desconocido'}
                      </span>
                    </div>

                    <div className="flex flex-col text-slate-500">
                      <span className="text-[10px] text-slate-450 uppercase font-semibold">Finalizado</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {chk.completed_at ? new Date(chk.completed_at).toLocaleDateString() : chk.scheduled_date}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleExpand(chk.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-all"
                    >
                      <span>{isExpanded ? 'Ocultar' : 'Detalles'}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-slide-up">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/40">
                      <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Detalles de la Evaluación</span>
                      <button
                        onClick={() => handleExportPDF(chk)}
                        disabled={isExporting === chk.id}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all duration-200"
                      >
                        <FileDown className="h-4 w-4" />
                        <span>{isExporting === chk.id ? 'Generando PDF...' : 'Descargar Reporte (PDF)'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-2 text-xs">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest block">
                          Observaciones Generales
                        </span>
                        <p className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border text-slate-650 dark:text-slate-300 leading-normal italic">
                          {chk.general_notes || 'Sin observaciones generales registradas.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest block">
                          Firma del Responsable
                        </span>
                        {chk.signature_url ? (
                          <div className="p-2 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center h-[90px]">
                            <img 
                              src={chk.signature_url} 
                              alt="Firma Digital" 
                              className="max-h-[85px] object-contain select-none"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Firma no disponible.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest block mb-2">
                        Respuestas del Cuestionario
                      </span>
                      <ResponsesList checklistId={chk.id} />
                    </div>
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
