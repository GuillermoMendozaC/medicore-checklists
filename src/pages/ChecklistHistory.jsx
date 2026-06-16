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
  Stethoscope,
  FileDown
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabase'

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

export default function ChecklistHistory() {
  const { useChecklistsList } = useChecklists()
  const { useEquipmentList } = useEquipment()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEqId, setSelectedEqId] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [isExporting, setIsExporting] = useState(null) // holds checklist ID currently exporting

  const handleExportPDF = async (chk) => {
    setIsExporting(chk.id)
    try {
      // 1. Fetch responses for this checklist from Supabase
      const { data: responses, error } = await supabase
        .from('checklist_responses')
        .select('*, template_item:checklist_template_items(*)')
        .eq('checklist_id', chk.id)
      
      if (error) throw error

      // 2. Generate PDF report
      await generateChecklistPDF(chk, responses || [])
    } catch (err) {
      console.error("Error exporting PDF:", err)
      alert("Error al exportar el reporte a PDF: " + err.message)
    } finally {
      setIsExporting(null)
    }
  }

  const generateChecklistPDF = async (chk, responses) => {
    const doc = new jsPDF()

    // Helper to load image as base64 safely
    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = () => resolve(null) // resolve null on error so PDF still generates
        img.src = url
      })
    }

    // Draw Header
    doc.setFillColor(49, 46, 129) // Indigo 900
    doc.rect(0, 0, 210, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('MEDICORE SYSTEMS', 15, 18)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Reporte de Inspección y Mantenimiento Técnico', 15, 25)
    doc.text(`ID Reporte: ${chk.id}`, 15, 32)

    // Document Title
    doc.setTextColor(30, 41, 59) // Slate 800
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('INFORME DE MANTENIMIENTO CLÍNICO', 15, 52)
    
    // Equipment Info Box
    doc.setDrawColor(226, 232, 240) // Slate 200
    doc.setFillColor(248, 250, 252) // Slate 50
    doc.roundedRect(15, 58, 180, 42, 3, 3, 'FD')

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // Slate 500
    doc.text('DETALLES DEL DISPOSITIVO MÉDICO', 20, 65)

    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    doc.text('Equipo:', 20, 72)
    doc.setFont('helvetica', 'normal')
    doc.text(chk.equipment?.name || 'N/A', 50, 72)

    doc.setFont('helvetica', 'bold')
    doc.text('Marca / Modelo:', 20, 78)
    doc.setFont('helvetica', 'normal')
    doc.text(`${chk.equipment?.brand || 'N/A'} / ${chk.equipment?.model || 'N/A'}`, 50, 78)

    doc.setFont('helvetica', 'bold')
    doc.text('Número de Serie:', 20, 84)
    doc.setFont('helvetica', 'normal')
    doc.text(chk.equipment?.serial_number || 'N/A', 50, 84)

    doc.setFont('helvetica', 'bold')
    doc.text('Ubicación:', 20, 90)
    doc.setFont('helvetica', 'normal')
    doc.text(chk.equipment?.location || 'N/A', 50, 90)

    doc.setFont('helvetica', 'bold')
    doc.text('Estado Operativo:', 20, 96)
    doc.setFont('helvetica', 'normal')
    doc.text(chk.equipment?.status === 'activo' ? 'Activo' : (chk.equipment?.status === 'inactivo' ? 'Inactivo' : 'En Reparación'), 50, 96)

    // Maintenance Info Box
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(15, 106, 180, 24, 3, 3, 'FD')

    doc.setTextColor(100, 116, 139)
    doc.text('INFORMACIÓN OPERATIVA', 20, 112)

    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    doc.text('Técnico Responsable:', 20, 119)
    doc.setFont('helvetica', 'normal')
    doc.text(chk.technician?.full_name || 'N/A', 62, 119)

    doc.setFont('helvetica', 'bold')
    doc.text('Fecha Completado:', 20, 125)
    doc.setFont('helvetica', 'normal')
    doc.text(chk.completed_at ? new Date(chk.completed_at).toLocaleString() : chk.scheduled_date, 62, 125)

    // Table of responses
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('EVALUACIÓN DE ÍTEMS', 15, 140)

    // Header line
    doc.setDrawColor(79, 70, 229) // Indigo 600
    doc.setLineWidth(0.8)
    doc.line(15, 143, 195, 143)

    let y = 150
    doc.setFontSize(9)
    doc.setLineWidth(0.2)
    doc.setDrawColor(226, 232, 240)

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i]
      
      // Check page overflow
      if (y > 250) {
        doc.addPage()
        y = 20
      }

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text(`${resp.template_item?.sort_order || i + 1}. ${resp.template_item?.label || 'Ítem'}`, 15, y)
      
      // Draw Value (PASA / FALLA or text)
      let valText = resp.value
      let isPasa = false
      let isFalla = false
      if (resp.template_item?.item_type === 'boolean') {
        isPasa = resp.value === 'true'
        isFalla = resp.value === 'false'
        valText = isPasa ? 'PASA' : 'FALLA'
      }

      doc.setFont('helvetica', 'bold')
      if (isPasa) doc.setTextColor(16, 185, 129) // Green
      else if (isFalla) doc.setTextColor(244, 63, 94) // Red
      else doc.setTextColor(79, 70, 229) // Indigo

      doc.text(valText || 'N/A', 170, y)

      // Optional item notes
      if (resp.notes) {
        y += 5
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(100, 116, 139)
        doc.text(`Nota: ${resp.notes}`, 20, y)
      }

      // Optional item photo evidence
      if (resp.photo_url) {
        y += 5
        const photoBase64 = await loadImage(resp.photo_url)
        if (photoBase64) {
          doc.addImage(photoBase64, 'JPEG', 20, y, 40, 30)
          y += 32
        } else {
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(244, 63, 94)
          doc.text('[Foto de evidencia no disponible para descarga]', 20, y)
          y += 4
        }
      }

      y += 8
      doc.line(15, y - 4, 195, y - 4)
    }

    // Check page overflow for notes and signature
    if (y > 220) {
      doc.addPage()
      y = 20
    }

    // General notes
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59)
    doc.text('OBSERVACIONES GENERALES', 15, y + 10)
    
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(chk.general_notes || 'Sin observaciones generales.', 15, y + 16, { maxWidth: 180 })

    y += 35

    // Signature Block
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text('FIRMA DEL TÉCNICO RESPONSABLE', 120, y + 5)

    if (chk.signature_url) {
      const sigBase64 = await loadImage(chk.signature_url)
      if (sigBase64) {
        doc.addImage(sigBase64, 'PNG', 120, y + 10, 60, 20)
      } else {
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(244, 63, 94)
        doc.text('[Firma digital no disponible]', 120, y + 15)
      }
    }

    doc.setLineWidth(0.4)
    doc.setDrawColor(148, 163, 184)
    doc.line(120, y + 32, 190, y + 32)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(chk.technician?.full_name || 'Firma autorizada', 120, y + 37)

    // Save the PDF
    doc.save(`Reporte_Mantenimiento_${chk.equipment?.name || 'Equipo'}_${chk.scheduled_date}.pdf`)
  }

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
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/40">
                      <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Detalles Completos de Inspección</span>
                      <button
                        onClick={() => handleExportPDF(chk)}
                        disabled={isExporting === chk.id}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all duration-200"
                      >
                        <FileDown className="h-4 w-4" />
                        <span>{isExporting === chk.id ? 'Generando PDF...' : 'Exportar Reporte (PDF)'}</span>
                      </button>
                    </div>

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
