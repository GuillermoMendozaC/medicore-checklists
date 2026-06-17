import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { Stethoscope, Search, MapPin, History, Info, Activity } from 'lucide-react'

export default function ClientEquipmentList() {
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: equipmentList, isLoading, isError, error } = useQuery({
    queryKey: ['client_equipment', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return []
      const { data, error } = await supabase
        .from('equipment')
        .select('*, category:equipment_categories(*)')
        .eq('client_id', profile.client_id)
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!profile?.client_id
  })

  const filteredEquipment = useMemo(() => {
    if (!equipmentList) return []
    return equipmentList.filter(item => {
      const term = searchTerm.toLowerCase()
      return (
        item.name.toLowerCase().includes(term) ||
        (item.brand && item.brand.toLowerCase().includes(term)) ||
        (item.model && item.model.toLowerCase().includes(term)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(term)) ||
        (item.location && item.location.toLowerCase().includes(term))
      )
    })
  }, [equipmentList, searchTerm])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'activo':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-205 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Operativo
          </span>
        )
      case 'inactivo':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
            Fuera de Servicio
          </span>
        )
      case 'en_reparacion':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            En Mantención / Soporte
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Equipos Médicos Registrados</h2>
          <p className="text-sm text-slate-500">Listado de dispositivos de su propiedad y su estado operativo actual.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, marca, serie, ubicación..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-white transition-all duration-200 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-rose-500 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm">
          Error al cargar sus equipos: {error.message}
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 text-center text-slate-500 shadow-sm">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-450" />
          No se encontraron equipos clínicos registrados para su cuenta.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEquipment.map((eq) => (
            <div key={eq.id} className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 dark:bg-slate-950 dark:group-hover:bg-indigo-950/40 text-slate-600 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight text-base">
                        {eq.name}
                      </h3>
                      <span className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">
                        {eq.category?.name || 'Sin Categoría'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-medium">Marca</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{eq.brand || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-medium">Modelo</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{eq.model || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-medium">N/S Serie</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono">{eq.serial_number || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-medium">Ubicación</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{eq.location || 'N/A'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {getStatusBadge(eq.status)}

                <Link
                  to={`/portal/equipos/${eq.id}/historial`}
                  className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <History className="h-3.5 w-3.5" />
                  Historial
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
