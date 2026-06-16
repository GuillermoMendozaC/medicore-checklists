import React, { useState } from 'react'
import { useTemplates } from '../hooks/useTemplates'
import { useEquipment } from '../hooks/useEquipment'
import { 
  FileCheck2, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ArrowUpDown, 
  Save, 
  X,
  Info,
  CheckCircle,
  Hash
} from 'lucide-react'

export default function TemplateList() {
  const { useCategories } = useEquipment()
  const { 
    useTemplatesList, 
    useCreateTemplate, 
    useDeleteTemplate,
    useTemplateItems,
    useCreateTemplateItem,
    useDeleteTemplateItem
  } = useTemplates()

  const { data: categories } = useCategories()
  const { data: templates, isLoading: isTemplatesLoading } = useTemplatesList()
  const createTemplateMutation = useCreateTemplate()
  const deleteTemplateMutation = useDeleteTemplate()

  // State for selected template
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  
  // Queries/Mutations for selected template items
  const { data: items, isLoading: isItemsLoading } = useTemplateItems(selectedTemplateId)
  const createItemMutation = useCreateTemplateItem()
  const deleteItemMutation = useDeleteTemplateItem()

  // Template Form State
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateCategoryId, setTemplateCategoryId] = useState('')
  const [templateFrequency, setTemplateFrequency] = useState('mensual')

  // Item Form State
  const [itemLabel, setItemLabel] = useState('')
  const [itemType, setItemType] = useState('boolean')
  const [itemIsRequired, setItemIsRequired] = useState(true)
  const [itemSortOrder, setItemSortOrder] = useState(0)

  const [errorMsg, setErrorMsg] = useState('')

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId)

  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    if (!templateName.trim() || !templateCategoryId) return
    setErrorMsg('')
    try {
      const newTemplate = await createTemplateMutation.mutateAsync({
        name: templateName,
        category_id: templateCategoryId,
        frequency: templateFrequency
      })
      setTemplateName('')
      setIsTemplateFormOpen(false)
      setSelectedTemplateId(newTemplate.id) // Automatically select new template
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear la plantilla')
    }
  }

  const handleDeleteTemplate = async (id, name) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la plantilla "${name}" y todos sus ítems asociados?`)) return
    setErrorMsg('')
    try {
      await deleteTemplateMutation.mutateAsync(id)
      if (selectedTemplateId === id) {
        setSelectedTemplateId(null)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar la plantilla')
    }
  }

  const handleCreateItem = async (e) => {
    e.preventDefault()
    if (!itemLabel.trim() || !selectedTemplateId) return
    setErrorMsg('')
    try {
      await createItemMutation.mutateAsync({
        template_id: selectedTemplateId,
        label: itemLabel,
        item_type: itemType,
        is_required: itemIsRequired,
        sort_order: itemSortOrder
      })
      setItemLabel('')
      setItemSortOrder(prev => Number(prev) + 1)
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el ítem')
    }
  }

  const handleDeleteItem = async (itemId) => {
    setErrorMsg('')
    try {
      await deleteItemMutation.mutateAsync({ id: itemId, template_id: selectedTemplateId })
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar el ítem')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Plantillas de Checklist</h2>
        <p className="text-sm text-slate-500">Configure los cuestionarios e inspecciones por tipo de equipo médico</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Templates List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="h-4.5 w-4.5 text-indigo-500" />
                Plantillas Existentes
              </h3>
              {!isTemplateFormOpen && (
                <button
                  onClick={() => setIsTemplateFormOpen(true)}
                  className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Nueva Plantilla"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Template Creation Form */}
            {isTemplateFormOpen && (
              <form onSubmit={handleCreateTemplate} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Nueva Plantilla</span>
                  <button type="button" onClick={() => setIsTemplateFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <label className="custom-label text-xs">Nombre de Plantilla</label>
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ej: Inspección Semanal"
                    className="custom-input text-xs py-2 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="custom-label text-xs">Categoría de Equipo</label>
                  <select
                    required
                    value={templateCategoryId}
                    onChange={(e) => setTemplateCategoryId(e.target.value)}
                    className="custom-input text-xs py-2 bg-white dark:bg-slate-900"
                  >
                    <option value="">Seleccione categoría...</option>
                    {categories?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="custom-label text-xs">Frecuencia</label>
                  <select
                    value={templateFrequency}
                    onChange={(e) => setTemplateFrequency(e.target.value)}
                    className="custom-input text-xs py-2 bg-white dark:bg-slate-900"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Crear Plantilla
                </button>
              </form>
            )}

            {isTemplatesLoading ? (
              <div className="py-6 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : templates?.length === 0 ? (
              <p className="text-slate-500 text-center text-xs py-4">No hay plantillas creadas.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto pr-1">
                {templates?.map(temp => (
                  <div
                    key={temp.id}
                    onClick={() => setSelectedTemplateId(temp.id)}
                    className={`flex items-center justify-between py-3 px-2 rounded-xl cursor-pointer transition-all ${
                      selectedTemplateId === temp.id
                        ? 'bg-indigo-50/50 dark:bg-slate-800'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <h4 className={`font-bold text-sm ${selectedTemplateId === temp.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-350'}`}>
                        {temp.name}
                      </h4>
                      <div className="flex gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span>{temp.category?.name || 'Categoría N/A'}</span>
                        <span>•</span>
                        <span>{temp.frequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTemplate(temp.id, temp.name)
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Template Items Editor */}
        <div className="lg:col-span-7">
          {selectedTemplate ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    Configurar Ítems: {selectedTemplate.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Frecuencia: {selectedTemplate.frequency} | Categoría: {selectedTemplate.category?.name}
                  </span>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-full">
                  {items?.length || 0} ítems
                </span>
              </div>

              {/* Add New Item Form */}
              <form onSubmit={handleCreateItem} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-12 font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1 mb-1">
                  <Plus className="h-3.5 w-3.5" />
                  Agregar Ítem a la Plantilla
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Pregunta / Variable Evaluada *</label>
                  <input
                    type="text"
                    required
                    value={itemLabel}
                    onChange={(e) => setItemLabel(e.target.value)}
                    placeholder="Ej: Calibración y alarmas..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Tipo de Dato</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="boolean">Pasa/Falla (Si/No)</option>
                    <option value="texto">Texto Libre</option>
                    <option value="numero">Valor Numérico</option>
                    <option value="seleccion">Selección Múltiple</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3" /> Orden
                  </label>
                  <input
                    type="number"
                    value={itemSortOrder}
                    onChange={(e) => setItemSortOrder(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-12 flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={itemIsRequired}
                      onChange={(e) => setItemIsRequired(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 h-3.5 w-3.5"
                    />
                    Es obligatorio responder
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar Ítem
                  </button>
                </div>
              </form>

              {/* Items List */}
              {isItemsLoading ? (
                <div className="py-6 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                </div>
              ) : items?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 border border-dashed rounded-xl">
                  Esta plantilla no tiene ítems configurados. Agréguelos arriba.
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Cuestionario Configurado
                  </span>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all">
                        <div className="flex gap-3">
                          <span className="h-5 w-5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500 font-bold flex items-center justify-center">
                            {item.sort_order}
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {item.label}
                              {item.is_required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                            </h4>
                            <div className="flex gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              <span>Tipo: {item.item_type}</span>
                              {item.is_required && <span>• Obligatorio</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-600">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-55 text-slate-400" />
              <p className="font-semibold text-sm">Selecciona una plantilla de la izquierda</p>
              <span className="text-xs">Podrás agregar, reordenar y configurar las preguntas e inspecciones.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
