import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ChecklistForm from '../components/checklist/ChecklistForm'
import { ClipboardList, Stethoscope, Calendar, CheckCircle, Info, RefreshCw } from 'lucide-react'
import confetti from 'canvas-confetti'
import { db } from '../lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { syncPendingChecklists } from '../lib/sync'
import { useSearchParams } from 'react-router-dom'

export default function ChecklistFill() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const queryEquipmentId = searchParams.get('equipment_id')
  const queryAppointmentId = searchParams.get('appointment_id')

  // Tab state: 'programada' (scheduled) or 'directa' (on-the-fly)
  const [fillMode, setFillMode] = useState('programada')
  
  // Selection states
  const [selectedChecklistId, setSelectedChecklistId] = useState('')
  const [selectedEqId, setSelectedEqId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [clientChecklistId, setClientChecklistId] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(false)

  // Pre-fill states from query params
  useEffect(() => {
    if (queryEquipmentId) {
      setFillMode('directa')
      setSelectedEqId(queryEquipmentId)
    }
    if (queryAppointmentId) {
      setAppointmentId(queryAppointmentId)
    }
  }, [queryEquipmentId, queryAppointmentId])

  // --- LOCAL DATA QUERIES (DEXIE) ---
  
  // 1. Fetch pending scheduled checklists from Dexie
  const pendingChecklists = useLiveQuery(async () => {
    try {
      const lists = await db.pending_checklists
        .where('status')
        .equals('pendiente')
        .toArray()
      
      const enriched = []
      for (const chk of lists) {
        const equipment = await db.equipment.get(chk.equipment_id)
        const template = await db.checklist_templates.get(chk.template_id)
        enriched.push({
          ...chk,
          equipment,
          template
        })
      }
      return enriched
    } catch (err) {
      console.error("Error reading pending checklists from Dexie:", err)
      return []
    }
  }, []) || []

  // 2. Fetch all cached active equipment
  const activeEquipment = useLiveQuery(async () => {
    try {
      return await db.equipment.toArray()
    } catch (err) {
      console.error("Error reading equipment from Dexie:", err)
      return []
    }
  }, []) || []

  // 3. Fetch all cached templates
  const allTemplates = useLiveQuery(async () => {
    try {
      return await db.checklist_templates.toArray()
    } catch (err) {
      console.error("Error reading templates from Dexie:", err)
      return []
    }
  }, []) || []

  // 4. Resolve selected entities based on mode
  const activeChecklist = fillMode === 'programada'
    ? pendingChecklists.find(c => c.id === selectedChecklistId)
    : null

  const selectedEquipment = fillMode === 'directa' && selectedEqId
    ? activeEquipment.find(e => e.id === selectedEqId)
    : activeChecklist?.equipment

  // Filter templates: only templates matching selected equipment's category
  const filteredTemplates = selectedEquipment
    ? allTemplates.filter(t => t.category_id === selectedEquipment.category_id)
    : allTemplates

  const selectedTemplate = fillMode === 'directa' && selectedTemplateId
    ? allTemplates.find(t => t.id === selectedTemplateId)
    : activeChecklist?.template

  // Generate a client UUID for the new checklist
  useEffect(() => {
    if (fillMode === 'directa' && selectedEqId && selectedTemplateId) {
      setClientChecklistId(crypto.randomUUID())
    }
  }, [fillMode, selectedEqId, selectedTemplateId])

  // 5. Fetch checklist items from Dexie based on active template
  const templateId = fillMode === 'programada'
    ? activeChecklist?.template_id
    : selectedTemplateId

  const templateItems = useLiveQuery(async () => {
    if (!templateId) return []
    try {
      return await db.checklist_template_items
        .where('template_id')
        .equals(templateId)
        .sortBy('sort_order')
    } catch (err) {
      console.error("Error reading template items from Dexie:", err)
      return []
    }
  }, [templateId]) || []

  // Submit and save locally
  const handleSubmitChecklist = async (formData) => {
    try {
      const checklistId = fillMode === 'programada' ? selectedChecklistId : clientChecklistId

      if (!checklistId) {
        alert("Error: ID de checklist inválido.")
        return
      }

      const equipmentId = fillMode === 'programada' ? activeChecklist?.equipment_id : selectedEqId
      const targetTemplateId = fillMode === 'programada' ? activeChecklist?.template_id : selectedTemplateId
      const scheduledDate = fillMode === 'programada' ? activeChecklist?.scheduled_date : new Date().toISOString().split('T')[0]

      // 1. Save completed checklist to Dexie
      await db.pending_checklists.put({
        id: checklistId,
        equipment_id: equipmentId,
        template_id: targetTemplateId,
        technician_id: user?.id,
        scheduled_date: scheduledDate,
        completed_at: new Date().toISOString(),
        status: 'completado',
        general_notes: formData.general_notes,
        signature_blob: formData.signature_blob,
        signature_url: formData.signature_url, // Saved temporarily for previews
        appointment_id: appointmentId || null // LINKED APPOINTMENT
      })

      // 2. Save responses to Dexie
      const responsesToSave = formData.responses.map(r => ({
        id: crypto.randomUUID(), // Avoid IndexedDB collisions
        checklist_id: checklistId,
        template_item_id: r.template_item_id,
        value: String(r.value),
        notes: r.notes || null,
        photo_blob: r.photo_blob || null,
        photo_url: r.photo_url || null
      }))

      await db.pending_responses.bulkPut(responsesToSave)

      // 3. Celebrate!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      })

      setIsCompletedSuccess(true)
      setSelectedChecklistId('')
      setSelectedEqId('')
      setSelectedTemplateId('')
      setClientChecklistId('')
      setAppointmentId('')

      // 4. Proactively run synchronization in background if online
      if (navigator.onLine) {
        syncPendingChecklists(user?.id)
      }
    } catch (err) {
      console.error("Error saving checklist:", err)
      alert("Error al guardar el checklist localmente: " + err.message)
    }
  }

  if (isCompletedSuccess) {
    return (
      <div className="max-w-xl mx-auto text-center p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md space-y-6 animate-slide-up mt-12">
        <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">¡Checklist Guardado Localmente!</h2>
          <p className="text-sm text-slate-500 leading-normal">
            El checklist de mantenimiento y firma digital se han guardado con éxito. Si tiene conexión a internet, se sincronizará automáticamente; de lo contrario, se subirá en segundo plano cuando recupere la señal.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Llenado de Checklist de Mantenimiento</h2>
          <p className="text-sm text-slate-500">Ejecute y reporte inspecciones de mantenimiento preventivo y correctivo</p>
        </div>

        {/* Toggle Mode Selector */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 w-fit text-xs font-bold shadow-sm">
          <button
            type="button"
            onClick={() => {
              setFillMode('programada')
              setSelectedChecklistId('')
              setSelectedEqId('')
              setSelectedTemplateId('')
            }}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              fillMode === 'programada'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Inspecciones Programadas
          </button>
          <button
            type="button"
            onClick={() => {
              setFillMode('directa')
              setSelectedChecklistId('')
              setSelectedEqId('')
              setSelectedTemplateId('')
            }}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              fillMode === 'directa'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Nueva Inspección Directa
          </button>
        </div>
      </div>

      {fillMode === 'programada' ? (
        /* SCHEDULED INSPS MODE */
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Seleccione el Equipo Programado (Local)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <select
                  value={selectedChecklistId}
                  onChange={(e) => setSelectedChecklistId(e.target.value)}
                  className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white cursor-pointer text-sm"
                >
                  <option value="">-- Seleccionar equipo y checklist pendiente --</option>
                  {pendingChecklists.map(chk => (
                    <option key={chk.id} value={chk.id}>
                      {chk.equipment?.name || 'Equipo Desconocido'} (N/S: {chk.equipment?.serial_number || 'N/A'}) - Programado: {chk.scheduled_date}
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
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Programado para el: {activeChecklist.scheduled_date}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DIRECT/ON-THE-FLY MODE */
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nueva Inspección de Equipo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Equipment selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Seleccione el Equipo Médico *</label>
                <select
                  value={selectedEqId}
                  onChange={(e) => {
                    setSelectedEqId(e.target.value)
                    setSelectedTemplateId('')
                  }}
                  className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white cursor-pointer text-sm"
                >
                  <option value="">-- Seleccionar equipo --</option>
                  {activeEquipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} (N/S: {eq.serial_number || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Template selection (filtered by category) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Seleccione la Plantilla de Inspección *</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  disabled={!selectedEqId}
                  className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Seleccionar plantilla --</option>
                  {filteredTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.frequency})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render selected checklist questionnaire */}
      {selectedEquipment && selectedTemplate ? (
        <div className="space-y-6">
          {/* Target Equipment Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md space-y-3 relative overflow-hidden">
            {/* Decorative stethoscope icon */}
            <Stethoscope className="absolute right-0 bottom-0 -mr-6 -mb-6 h-28 w-28 text-white/5 pointer-events-none" />

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-indigo-600 text-indigo-200 font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/20">
                  Dispositivo Evaluado
                </span>
                <h3 className="text-xl font-bold mt-1.5">{selectedEquipment.name}</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                ID Registro: <span>{selectedEquipment.id.slice(0, 8)}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
              <div className="flex flex-col">
                <span className="text-slate-450">Marca</span>
                <span className="font-semibold">{selectedEquipment.brand || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-450">Modelo</span>
                <span className="font-semibold">{selectedEquipment.model || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-450">Número de Serie</span>
                <span className="font-semibold font-mono text-slate-200">{selectedEquipment.serial_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-450">Ubicación Física</span>
                <span className="font-semibold">{selectedEquipment.location || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Form questionnaire */}
          {templateItems.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500">
              Cargando preguntas de la plantilla...
            </div>
          ) : (
            <ChecklistForm
              checklist={activeChecklist || { template_id: selectedTemplateId }}
              templateItems={templateItems}
              onSubmit={handleSubmitChecklist}
            />
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
          <p className="font-semibold text-sm">Seleccione un checklist o equipo para iniciar</p>
          <span className="text-xs">Se cargarán las preguntas asociadas al dispositivo de forma automática.</span>
        </div>
      )}
    </div>
  )
}
