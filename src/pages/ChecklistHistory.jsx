import React, { useState } from 'react'
import { useChecklists } from '../hooks/useChecklists'
import { useEquipment } from '../hooks/useEquipment'
import { 
  History, 
  Calendar, 
  Search, 
  User, 
  CheckSquare, 
  XSquare, 
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Stethoscope
} from 'lucide-react'

// Sub-component to render detailed item responses for a selected checklist
function ResponsesList({ checklistId }) {
  const { useChecklistResponses } = useChecklists()
  const { data: responses, isLoading, isError } = useChecklistResponses(checklistId)

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
        </div>
      ))}
    </div>
  )
}

export default function ChecklistHistory() {
  const { useChecklistsList } = useChecklists()
  const { useEquipmentList } = useEquipment()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEqId, setSelectedEqId] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  // Load completed checklists
  const { data: checklists, isLoading, isError, error } = useChecklistsList({
    status: 'completado',
    equipment_id: selectedEqId || null,
    start_date: startDate || null,
    end_date: endDate || null
  })

  // Load equipment for filters
  const { data: equipmentList } = useEquipmentList()

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Historial de Mantenimientos</h2>
        <p className="text-sm text-slate-500">Historial y auditorías de checklists completados</p>
      </div>

      {/* Date Range & Equipment Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Buscar por Equipo Médico</label>
          <select
            value={selectedEqId}
            onChange={(e) => setSelectedEqId(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-500 dark:text-white cursor-pointer"
          >
            <option value="">Todos los equipos</option>
            {equipmentList?.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name} (S/N: {eq.serial_number || 'N/A'})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Desde fecha
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-500 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Hasta fecha
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-500 dark:text-white"
          />
        </div>
      </div>

      {/* Checklist Audit Logs */}
      {isLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-rose-500 bg-white dark:bg-slate-900 border rounded-2xl">
          Error al cargar historial: {error.message}
        </div>
      ) : checklists?.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 text-center text-slate-500">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No se encontraron mantenimientos completados que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((chk) => {
            const isExpanded = expandedId === chk.id
            return (
              <div 
                key={chk.id} 
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 dark:text-white text-base leading-tight">
                          {chk.equipment?.name}
                        </h4>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded uppercase">
                          S/N: {chk.equipment?.serial_number || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Inspección: <span className="font-medium text-slate-600 dark:text-slate-350">{chk.template?.name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex flex-col text-slate-500">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Técnico</span>
                      <span className="font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <User className="h-3 w-3" />
                        {chk.technician?.full_name || 'Desconocido'}
                      </span>
                    </div>

                    <div className="flex flex-col text-slate-500">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Completado</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {chk.completed_at ? new Date(chk.completed_at).toLocaleDateString() : chk.scheduled_date}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleExpand(chk.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-all"
                    >
                      <span>{isExpanded ? 'Ocultar' : 'Detalles'}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-2 text-xs">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest block">
                          Observaciones Generales
                        </span>
                        <p className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border text-slate-600 dark:text-slate-300 leading-normal italic">
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
                              className="max-h-[80px] object-contain select-none"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Sin firma digital disponible.</span>
                        )}
                      </div>
                    </div>

                    {/* Dynamic query of checklist item values */}
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
