import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChecklists } from '../hooks/useChecklists'
import { useEquipment } from '../hooks/useEquipment'
import { useTemplates } from '../hooks/useTemplates'
import { Link } from 'react-router-dom'
import { 
  ClipboardList, 
  CheckCircle, 
  Stethoscope, 
  FolderHeart,
  PlusCircle,
  Calendar,
  User,
  Activity,
  ArrowUpRight
} from 'lucide-react'

export default function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const { useChecklistsList, useCreateChecklist, useTechnicians } = useChecklists()
  const { useEquipmentList } = useEquipment()
  const { useTemplatesList } = useTemplates()

  // Queries
  const { data: checklists, isLoading: isChksLoading } = useChecklistsList()
  const { data: equipmentList } = useEquipmentList()
  const { data: templates } = useTemplatesList()
  const { data: technicians } = useTechnicians()
  
  const createChecklistMutation = useCreateChecklist()

  // Scheduling Form State (Admin only)
  const [eqId, setEqId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [techId, setTechId] = useState('')
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleSuccess, setScheduleSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Compute metrics
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const pendingCount = checklists?.filter(c => c.status === 'pendiente').length || 0
  
  const completedThisMonthCount = checklists?.filter(c => {
    if (c.status !== 'completado' || !c.completed_at) return false
    const date = new Date(c.completed_at)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length || 0

  const equipmentCount = equipmentList?.length || 0
  const categoriesCount = new Set(equipmentList?.map(e => e.category_id).filter(Boolean)).size || 0

  // Schedule a new checklist
  const handleSchedule = async (e) => {
    e.preventDefault()
    if (!eqId || !templateId || !techId || !schedDate) {
      setErrorMsg('Por favor complete todos los campos para programar.')
      return
    }
    setErrorMsg('')
    setScheduleSuccess(false)

    try {
      await createChecklistMutation.mutateAsync({
        equipment_id: eqId,
        template_id: templateId,
        technician_id: techId,
        scheduled_date: schedDate,
        status: 'pendiente'
      })
      setEqId('')
      setTemplateId('')
      setTechId('')
      setScheduleSuccess(true)
      setTimeout(() => setScheduleSuccess(false), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al programar el mantenimiento.')
    }
  }

  // Get current technician pending tasks
  const techPending = checklists?.filter(c => c.status === 'pendiente' && c.technician_id === profile?.id) || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 relative">
          <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/30 text-indigo-200 py-1 px-3 rounded-full border border-indigo-500/20">
            {profile?.role === 'admin' ? 'Área de Control Administrativo' : 'Área de Campo Técnica'}
          </span>
          <h2 className="text-2xl md:text-3xl font-black">¡Hola, {profile?.full_name}!</h2>
          <p className="text-sm text-indigo-200 leading-normal max-w-xl">
            Bienvenido al panel operativo de MediCore. Aquí puede supervisar el estado de los mantenimientos de equipos clínicos de su organización.
          </p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md self-start md:self-auto text-xs font-semibold">
          <Activity className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
          <span>Servidores Supabase Activos</span>
        </div>
      </div>

      {/* Stats Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Pendientes</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white">{isChksLoading ? '...' : pendingCount}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Completados (Mes)</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white">{isChksLoading ? '...' : completedThisMonthCount}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Equipos Médicos</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white">{equipmentCount}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
            <FolderHeart className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Categorías de Equipo</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white">{categoriesCount}</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {isAdmin ? (
          <>
            {/* Left: Schedule Maintenance Form */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 border-b pb-3 border-slate-150">
                <PlusCircle className="h-5 w-5 text-indigo-500" />
                Programar Mantenimiento Preventivo
              </h3>

              {scheduleSuccess && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200">
                  ¡Checklist de mantenimiento programado correctamente!
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSchedule} className="space-y-4 text-sm">
                <div>
                  <label className="custom-label text-xs">Equipo Médico *</label>
                  <select
                    required
                    value={eqId}
                    onChange={(e) => setEqId(e.target.value)}
                    className="custom-input dark:bg-slate-950 dark:border-slate-800"
                  >
                    <option value="">Seleccione el equipo...</option>
                    {equipmentList?.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} (S/N: {eq.serial_number || 'N/A'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="custom-label text-xs">Plantilla del Checklist *</label>
                  <select
                    required
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="custom-input dark:bg-slate-950 dark:border-slate-800"
                  >
                    <option value="">Seleccione la plantilla...</option>
                    {templates?.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.frequency})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="custom-label text-xs">Técnico Asignado *</label>
                  <select
                    required
                    value={techId}
                    onChange={(e) => setTechId(e.target.value)}
                    className="custom-input dark:bg-slate-950 dark:border-slate-800"
                  >
                    <option value="">Seleccione técnico de soporte...</option>
                    {technicians?.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="custom-label text-xs">Fecha Programada *</label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="custom-input dark:bg-slate-950 dark:border-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Programar Inspección
                </button>
              </form>
            </div>

            {/* Right: Operational Schedule Summary */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 border-b pb-3 border-slate-150">
                <Calendar className="h-5 w-5 text-indigo-500" />
                Planificación Operativa Reciente
              </h3>

              {isChksLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                </div>
              ) : checklists?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No hay mantenimientos programados.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
                  {checklists?.slice(0, 5).map(chk => (
                    <div key={chk.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">{chk.equipment?.name}</h4>
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {chk.technician?.full_name}</span>
                          <span>•</span>
                          <span>Frecuencia: {chk.template?.frequency}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          chk.status === 'completado' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-rose-50 text-rose-700 animate-pulse'
                        }`}>
                          {chk.status === 'completado' ? 'Completado' : 'Pendiente'}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">{chk.scheduled_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Técnico View: Show pending assigned checklists */
          <div className="lg:col-span-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 border-b pb-3 border-slate-150">
              <ClipboardList className="h-5 w-5 text-indigo-500" />
              Sus Inspecciones Asignadas Pendientes
            </h3>

            {isChksLoading ? (
              <div className="py-8 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : techPending.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-sm">¡Al día! No tiene checklists pendientes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techPending.map(chk => (
                  <div key={chk.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-55/30 hover:border-slate-200 dark:hover:border-slate-850 flex flex-col justify-between gap-4 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded uppercase">
                          Pendiente
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{chk.scheduled_date}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-700 dark:text-white mt-2">
                        {chk.equipment?.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Cuestionario: <span className="font-semibold text-indigo-600">{chk.template?.name}</span>
                      </p>
                    </div>
                    <Link
                      to="/fill"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      Empezar Llenado
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
