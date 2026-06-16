import React, { useState, useEffect } from 'react'
import { Check, X, ClipboardPen, HelpCircle, Camera, Trash2 } from 'lucide-react'

export default function ChecklistItem({ item, response, onChange }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (response.photo_blob) {
      const url = URL.createObjectURL(response.photo_blob)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [response.photo_blob])

  const handleValueChange = (val) => {
    onChange({ ...response, value: val })
  }

  const handleNotesChange = (notesVal) => {
    onChange({ ...response, notes: notesVal })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      onChange({ ...response, photo_blob: file })
    }
  }

  const handleRemovePhoto = () => {
    onChange({ ...response, photo_blob: null })
  }

  // Pre-configured options for multiple selection:
  const selectionOptions = ["Óptimo", "Aceptable", "Mantenimiento requerido", "Defectuoso"]

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-2.5">
          <span className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
            {item.sort_order}
          </span>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug">
              {item.label}
              {item.is_required && <span className="text-rose-500 ml-1">*</span>}
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              {item.item_type === 'boolean' ? 'Estado Binario' : 
               item.item_type === 'numero' ? 'Medición Numérica' : 
               item.item_type === 'seleccion' ? 'Selección Múltiple' : 'Detalle de Texto'}
            </span>
          </div>
        </div>
      </div>

      {/* Render input widgets dynamically based on item_type */}
      <div className="mt-2">
        {item.item_type === 'boolean' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleValueChange('true')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm border flex items-center justify-center gap-2 transition-all duration-200 ${
                response.value === 'true'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/5'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              <Check className="h-4 w-4" />
              Pasa / Conforme
            </button>
            <button
              type="button"
              onClick={() => handleValueChange('false')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm border flex items-center justify-center gap-2 transition-all duration-200 ${
                response.value === 'false'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/30 dark:border-rose-600 dark:text-rose-400 shadow-md shadow-rose-500/5'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              <X className="h-4 w-4" />
              No Pasa / Falla
            </button>
          </div>
        )}

        {item.item_type === 'texto' && (
          <input
            type="text"
            required={item.is_required}
            value={response.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Ingrese la descripción o comentario..."
            className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-indigo-500"
          />
        )}

        {item.item_type === 'numero' && (
          <input
            type="number"
            step="any"
            required={item.is_required}
            value={response.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Ingrese el valor medido..."
            className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-indigo-500"
          />
        )}

        {item.item_type === 'seleccion' && (
          <select
            required={item.is_required}
            value={response.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="custom-input dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-indigo-500"
          >
            <option value="">-- Seleccionar estado --</option>
            {selectionOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}
      </div>

      {/* Field for notes per item */}
      <div className="mt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <ClipboardPen className="h-3 w-3" />
          <span>Observaciones / Detalles específicos (Opcional)</span>
        </div>
        <input
          type="text"
          value={response.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Escriba notas adicionales para este ítem..."
          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg outline-none focus:border-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
        />
      </div>

      {/* Photo evidence section */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Camera className="h-4 w-4" />
          <span>Foto de Evidencia (Opcional)</span>
        </div>

        <div className="flex items-center gap-3">
          {previewUrl ? (
            <div className="flex items-center gap-3 bg-slate-55/40 dark:bg-slate-950 p-2 rounded-xl border border-slate-150/80 dark:border-slate-850">
              <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200/60 bg-slate-100 relative group flex items-center justify-center flex-shrink-0">
                <img src={previewUrl} alt="Vista previa" className="h-full w-full object-cover" />
              </div>
              <div className="text-left">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide">Cargada</span>
                <span className="block text-xs font-bold text-slate-650 dark:text-slate-300 max-w-[120px] truncate">
                  {response.photo_blob?.name || 'evidencia.jpg'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Eliminar foto"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-slate-600 hover:text-indigo-650 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 rounded-xl cursor-pointer text-xs font-semibold shadow-sm transition-all duration-200">
              <Camera className="h-3.5 w-3.5" />
              <span>Tomar / Subir Foto</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
