import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChecklists } from '../hooks/useChecklists'
import { useTemplates } from '../hooks/useTemplates'
import ChecklistForm from '../components/checklist/ChecklistForm'
import { ClipboardList, Stethoscope, Calendar, PenTool, CheckCircle, Info } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function ChecklistFill() {
  const { user } = useAuth()
  const { useChecklistsList, useCompleteChecklist } = useChecklists()
  const { useTemplateItems } = useTemplates()

  // Fetch pending checklists for this technician
  const { 
    data: pendingChecklists, 
    isLoading: isChecklistsLoading,
    isError
  } = useChecklistsList({ 
    status: 'pendiente', 
    technician_id: user?.id 
  })

  const completeMutation = useCompleteChecklist()

  // State for currently selected checklist
  const [selectedChecklistId, setSelectedChecklistId] = useState('')
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(false)

  // Find selected checklist details
  const activeChecklist = pendingChecklists?.find(c => c.id === selectedChecklistId)

  // Query items for this template
  const { 
    data: templateItems, 
    isLoading: isItemsLoading 
  } = useTemplateItems(activeChecklist?.template_id)

  const handleSubmitChecklist = async (formData) => {
    try {
      await completeMutation.mutateAsync({
        id: selectedChecklistId,
        general_notes: formData.general_notes,
        signature_url: formData.signature_url,
        responses: formData.responses
      })
      
      // Fire celebratory confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      })

      setIsCompletedSuccess(true)
      setSelectedChecklistId('')
    } catch (err) {
      console.error("Error submitting checklist:", err)
      alert("Error al guardar el checklist: " + err.message)
    }
  }

  if (isCompletedSuccess) {
    return (
      <div className="max-w-xl mx-auto text-center p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md space-y-6 animate-slide-up mt-12">
        <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">¡Checklist Completado Exitosamente!</h2>
          <p className="text-sm text-slate-500 leading-normal">
            El informe técnico de mantenimiento preventivo y firma digital se han guardado de forma segura en la base de datos de MediCore.
          </p>
        </div>
        <button
          onClick={() => setIsCompletedSuccess(false)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-colors"
        >
          Llenar Otro Checklist
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Llenado de Checklist de Mantenimiento</h2>
        <p className="text-sm text-slate-500">Ejecute y reporte inspecciones preventivas en equipos asignados</p>
      </div>

      {isChecklistsLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-rose-500 bg-white dark:bg-slate-900 border rounded-2xl">
          Error al cargar los checklists pendientes.
        </div>
      ) : pendingChecklists?.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-dashed text-center space-y-2">
          <ClipboardList className="h-10 w-10 mx-auto text-slate-400 opacity-60" />
          <h3 className="font-bold text-slate-700 dark:text-slate-350">No tienes checklists pendientes</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Gran trabajo. Todas tus inspecciones programadas para mantenimiento de equipos están al día.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pick pending checklist */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Seleccione el Equipo Programado
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <select
                  value={selectedChecklistId}
                  onChange={(e) => setSelectedChecklistId(e.target.value)}
                  className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="">-- Seleccionar equipo y checklist pendiente --</option>
                  {pendingChecklists.map(chk => (
                    <option key={chk.id} value={chk.id}>
                      {chk.equipment?.name} (N/S: {chk.equipment?.serial_number || 'N/A'}) - Programado: {chk.scheduled_date}
                    </option>
                  ))}
                </select>
              </div>
              
              {activeChecklist && (
                <div className="p-3 bg-indigo-50/50 dark:bg-slate-800/40 rounded-xl border border-indigo-100/30 text-xs text-slate-600 dark:text-slate-300 flex flex-col justify-center gap-1">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    Inspección: {activeChecklist.template?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    Programado para el: {activeChecklist.scheduled_date}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Active Checklist Fill Form */}
          {activeChecklist ? (
            <div className="space-y-6">
              {/* Target Equipment Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md space-y-3 relative overflow-hidden">
                {/* Decorative stethoscope icon on BG */}
                <Stethoscope className="absolute right-0 bottom-0 -mr-6 -mb-6 h-28 w-28 text-white/5 pointer-events-none" />

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-indigo-600/30 text-indigo-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/20">
                      Dispositivo Evaluado
                    </span>
                    <h3 className="text-xl font-bold mt-1.5">{activeChecklist.equipment?.name}</h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    ID Registro: <span className="font-mono text-slate-300">{activeChecklist.equipment?.id.slice(0,8)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
                  <div className="flex flex-col">
                    <span className="text-slate-400">Marca</span>
                    <span className="font-semibold">{activeChecklist.equipment?.brand || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400">Modelo</span>
                    <span className="font-semibold">{activeChecklist.equipment?.model || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400">Número de Serie</span>
                    <span className="font-semibold font-mono text-slate-300">{activeChecklist.equipment?.serial_number || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400">Ubicación Física</span>
                    <span className="font-semibold">{activeChecklist.equipment?.location || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Main Questionnaire */}
              {isItemsLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                </div>
              ) : (
                <ChecklistForm
                  checklist={activeChecklist}
                  templateItems={templateItems || []}
                  onSubmit={handleSubmitChecklist}
                />
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-dashed rounded-2xl text-slate-400">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
              <p className="font-semibold text-sm">Seleccione un checklist programado para iniciar</p>
              <span className="text-xs">Se cargarán las preguntas asociadas al dispositivo de forma automática.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
