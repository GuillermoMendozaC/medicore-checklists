import React, { useState, useMemo } from 'react'
import EquipmentCard from './EquipmentCard'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'

export default function EquipmentList({ equipmentList = [], categories = [], onEdit, onDelete, isAdmin }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === '' || item.category_id === selectedCategory
      const matchesStatus = selectedStatus === '' || item.status === selectedStatus

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [equipmentList, searchTerm, selectedCategory, selectedStatus])

  return (
    <div className="space-y-6">
      {/* Filtering and Searching Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, marca, serie, ubicación..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-white transition-all duration-200"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="flex-1 md:flex-initial relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-[180px] pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-500 dark:text-white appearance-none cursor-pointer text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex-1 md:flex-initial relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full md:w-[150px] pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-500 dark:text-white appearance-none cursor-pointer text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="en_reparacion">En Reparación</option>
            </select>
            <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid List */}
      {filteredEquipment.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-500 font-medium">No se encontraron equipos médicos.</p>
          <span className="text-xs text-slate-400 mt-1">Prueba a ajustar tus filtros o buscar otro término.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEquipment.map(eq => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}
