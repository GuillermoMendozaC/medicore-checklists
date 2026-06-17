import React, { useState } from 'react'
import { Save, X } from 'lucide-react'

export default function EquipmentForm({ initialValues = null, onSubmit, onCancel, categories = [], clients = [], hideClientSelector = false }) {
  const [name, setName] = useState(initialValues?.name || '')
  const [categoryId, setCategoryId] = useState(initialValues?.category_id || '')
  const [brand, setBrand] = useState(initialValues?.brand || '')
  const [model, setModel] = useState(initialValues?.model || '')
  const [serialNumber, setSerialNumber] = useState(initialValues?.serial_number || '')
  const [location, setLocation] = useState(initialValues?.location || '')
  const [status, setStatus] = useState(initialValues?.status || 'activo')
  const [clientId, setClientId] = useState(initialValues?.client_id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        category_id: categoryId || null,
        brand,
        model,
        serial_number: serialNumber,
        location,
        status,
        client_id: clientId || null
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="custom-label">Nombre del Equipo *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Monitor de Signos Vitales, Autoclave..."
            className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="custom-label">Categoría *</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          >
            <option value="">-- Seleccionar categoría --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {!hideClientSelector && (
          <div>
            <label className="custom-label">Propietario / Cliente (Clínica)</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white cursor-pointer"
            >
              <option value="">-- Sin propietario (Uso Interno) --</option>
              {clients.map(cli => (
                <option key={cli.id} value={cli.id}>{cli.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="custom-label">Marca</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Ej: Philips, Tuttnauer, Siemens"
            className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="custom-label">Modelo</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Ej: Goldway G30, 2540M"
            className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="custom-label">Número de Serie</label>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Ej: SN-92384-X"
            className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="custom-label">Ubicación física / Sala</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej: Quirófano 3, Sala de Esterilización"
            className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
        </div>

        <div className="md:col-span-2">
          <label className="custom-label">Estado Operativo</label>
          <div className="flex gap-4">
            {[
              { id: 'activo', label: 'Activo / Operativo', color: 'border-emerald-500 text-emerald-700 bg-emerald-50/20' },
              { id: 'inactivo', label: 'Inactivo / Fuera de Servicio', color: 'border-slate-300 text-slate-700 bg-slate-50/20' },
              { id: 'en_reparacion', label: 'En Reparación / Soporte', color: 'border-amber-500 text-amber-700 bg-amber-50/20' }
            ].map(item => (
              <label 
                key={item.id}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                  status === item.id 
                    ? `${item.color} ring-2 ring-indigo-500/20 font-semibold` 
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={item.id}
                  checked={status === item.id}
                  onChange={() => setStatus(item.id)}
                  className="sr-only"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl flex items-center gap-2 transition-colors"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar Equipo'}
        </button>
      </div>
    </form>
  )
}
