import React from 'react'
import { Stethoscope, MapPin, Tag, Edit3, Trash2, ShieldAlert } from 'lucide-react'

export default function EquipmentCard({ equipment, onEdit, onDelete, isAdmin }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'activo':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Activo
          </span>
        )
      case 'inactivo':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border border-slate-200 dark:border-slate-800/30 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
            Inactivo
          </span>
        )
      case 'en_reparacion':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            En Reparación
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 dark:bg-slate-950 dark:group-hover:bg-indigo-950/40 text-slate-600 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 flex items-center justify-center transition-colors">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight text-base">
                {equipment.name}
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                {equipment.category?.name || 'Sin Categoría'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Marca</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{equipment.brand || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Modelo</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{equipment.model || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">N/S Serie</span>
            <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono">{equipment.serial_number || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Ubicación</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{equipment.location || 'N/A'}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        {getStatusBadge(equipment.status)}

        {isAdmin && (
          <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(equipment)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Editar equipo"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`¿Seguro que deseas eliminar el equipo: ${equipment.name}?`)) {
                  onDelete(equipment.id)
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Eliminar equipo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
