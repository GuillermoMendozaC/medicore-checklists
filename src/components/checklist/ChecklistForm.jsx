import React, { useState, useEffect } from 'react'
import ChecklistItem from './ChecklistItem'
import SignaturePad from './SignaturePad'
import { CheckSquare, Info, ShieldCheck } from 'lucide-react'
import { dataURLtoBlob } from '../../lib/sync'

export default function ChecklistForm({ checklist, templateItems = [], onSubmit }) {
  const [responses, setResponses] = useState([])
  const [generalNotes, setGeneralNotes] = useState('')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Initialize responses based on template items
  useEffect(() => {
    if (templateItems.length > 0) {
      setResponses(
        templateItems.map(item => ({
          template_item_id: item.id,
          value: '',
          notes: '',
          photo_blob: null
        }))
      )
    }
  }, [templateItems])

  const handleResponseChange = (index, updatedResponse) => {
    const updated = [...responses]
    updated[index] = updatedResponse
    setResponses(updated)
    setErrorMsg('') // Clear error message when user makes changes
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation: Check if all required items are answered
    for (let i = 0; i < templateItems.length; i++) {
      const item = templateItems[i]
      const resp = responses.find(r => r.template_item_id === item.id)
      
      if (item.is_required && (!resp || resp.value === undefined || resp.value === null || String(resp.value).trim() === '')) {
        setErrorMsg(`Por favor responda a la pregunta obligatoria: "${item.label}"`)
        return
      }
    }

    // Validation: Check signature
    if (!signatureUrl || signatureUrl.trim() === '') {
      setErrorMsg('Es obligatorio firmar el checklist para poder completarlo.')
      return
    }

    setErrorMsg('')
    try {
      const signatureBlob = await dataURLtoBlob(signatureUrl)
      onSubmit({
        general_notes: generalNotes,
        signature_url: signatureUrl,
        signature_blob: signatureBlob,
        responses: responses
      })
    } catch (err) {
      console.error("Error converting signature dataURL to blob:", err)
      setErrorMsg("Error al guardar la firma digital.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Validation Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2 animate-pulse">
          <Info className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Checklist items list */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
          Ítems de Evaluación
        </h3>
        
        {templateItems.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500">
            Esta plantilla no contiene ítems configurados.
          </div>
        ) : (
          templateItems.map((item, index) => {
            const resp = responses.find(r => r.template_item_id === item.id) || { value: '', notes: '' }
            return (
              <ChecklistItem
                key={item.id}
                item={item}
                response={resp}
                onChange={(updated) => handleResponseChange(index, updated)}
              />
            )
          })
        )}
      </div>

      {/* General notes */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Observaciones Generales de la Inspección
        </label>
        <textarea
          rows={4}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Escriba aquí comentarios generales sobre el estado físico y operacional del equipo..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm resize-y"
        />
      </div>

      {/* Signature and Confirmation */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <SignaturePad
            onSave={(url) => {
              setSignatureUrl(url)
              setErrorMsg('')
            }}
            value={signatureUrl}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 leading-normal flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>
              Al completar este checklist, certifica que ha realizado la inspección de acuerdo a los estándares técnicos establecidos por MediCore.
            </span>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all duration-200"
          >
            Completar Checklist
          </button>
        </div>
      </div>
    </form>
  )
}
