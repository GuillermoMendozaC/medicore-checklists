import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChecklists } from '../hooks/useChecklists'
import { useEquipment } from '../hooks/useEquipment'
import { useTemplates } from '../hooks/useTemplates'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { 
  ClipboardList, 
  CheckCircle, 
  Stethoscope, 
  FolderHeart,
  PlusCircle,
  Calendar,
  User,
  Activity,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  ShieldAlert
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

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

  const { data: assignedAppointments } = useQuery({
    queryKey: ['assigned_appointments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('appointments')
        .select('*, client:clients(*), equipment:equipment(*, category:equipment_categories(*))')
        .eq('assigned_technician_id', profile.id)
        .eq('status', 'asignada')
      if (error) throw error
      return data
    },
    enabled: !!profile?.id && profile?.role === 'tecnico'
  })
  
  const createChecklistMutation = useCreateChecklist()

  // Scheduling Form State (Admin only)
  const [eqId, setEqId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [techId, setTechId] = useState('')
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleSuccess, setScheduleSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Date constants
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // --- STATS AND CHARTS CALCULATIONS ---
  
  const pendingCount = checklists?.filter(c => c.status === 'pendiente').length || 0
  
  // Total completed checklists in current month
  const completedThisMonthCount = checklists?.filter(c => {
    if (c.status !== 'completado' || !c.completed_at) return false
    const date = new Date(c.completed_at)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length || 0

  // Total scheduled checklists for current month (completed + pending)
  const scheduledThisMonthCount = checklists?.filter(c => {
    const date = new Date(c.completed_at || c.scheduled_date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length || 0

  const equipmentCount = equipmentList?.length || 0
  const categoriesCount = new Set(equipmentList?.map(e => e.category_id).filter(Boolean)).size || 0

  // Calculate compliance rate percentage
  const complianceRate = scheduledThisMonthCount > 0
    ? Math.round((completedThisMonthCount / scheduledThisMonthCount) * 100)
    : 100

  // Compliance Pie Chart Data (Donut)
  const complianceData = [
    { name: 'Completados', value: completedThisMonthCount },
    { name: 'Pendientes', value: scheduledThisMonthCount - completedThisMonthCount }
  ]

  // Count completed checklists by equipment category
  const categoryCounts = {}
  checklists?.forEach(c => {
    if (c.status === 'completado' && c.equipment?.category?.name) {
      const catName = c.equipment.category.name
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1
    }
  })

  const barData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    completados: value
  }))

  // --- MAINTENANCE DUE ALERTS ("ATENCIÓN REQUERIDA") ---
  const alerts = []
  
  if (equipmentList && templates && checklists) {
    equipmentList.forEach(eq => {
      // Find templates associated with equipment's category
      const matchingTemplates = templates.filter(t => t.category_id === eq.category_id)
      
      matchingTemplates.forEach(temp => {
        // Find completed checklists for this specific equipment and template
        const completedChks = checklists.filter(c => 
          c.equipment_id === eq.id && 
          c.template_id === temp.id && 
          c.status === 'completado'
        )

        let lastCompleted = null
        if (completedChks.length > 0) {
          // Sort by completion date descending
          const sorted = [...completedChks].sort((a, b) => 
            new Date(b.completed_at || b.scheduled_date) - new Date(a.completed_at || a.scheduled_date)
          )
          lastCompleted = sorted[0]
        }

        let nextDueDate = null
        let daysLeft = -Infinity
        let status = 'vencido'
        let label = ''

        if (lastCompleted) {
          const completedDate = new Date(lastCompleted.completed_at || lastCompleted.scheduled_date)
          
          nextDueDate = new Date(completedDate)
          const freq = temp.frequency || 'mensual'
          if (freq === 'semanal') {
            nextDueDate.setDate(nextDueDate.getDate() + 7)
          } else if (freq === 'mensual') {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1)
          } else if (freq === 'trimestral') {
            nextDueDate.setMonth(nextDueDate.getMonth() + 3)
          } else if (freq === 'anual') {
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
          }

          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const nextDueTime = new Date(nextDueDate)
          nextDueTime.setHours(0, 0, 0, 0)

          const diffTime = nextDueTime - today
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (daysLeft <= 0) {
            status = 'vencido'
            label = daysLeft === 0 
              ? 'Vence hoy' 
              : `Vencido hace ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'día' : 'días'}`
          } else if (daysLeft <= 7) {
            status = 'proximo'
            label = `Vence en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`
          } else {
            // Compliant, no alert needed
            return
          }
        } else {
          // Never maintained
          status = 'vencido'
          label = 'Sin inspección previa'
        }

        alerts.push({
          id: `${eq.id}-${temp.id}`,
          equipment: eq,
          template: temp,
          nextDueDate,
          daysLeft,
          status,
          label
        })
      })
    })
  }

  // Sort: Overdue first, then by urgency (daysLeft ascending)
  alerts.sort((a, b) => {
    if (a.status === 'vencido' && b.status !== 'vencido') return -1
    if (a.status !== 'vencido' && b.status === 'vencido') return 1
    return a.daysLeft - b.daysLeft
  })

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

      {/* --- RECHARTS ANALYTICS VIEW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Compliance Donut chart */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center relative min-h-[300px]">
          <h3 className="w-full text-left font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide border-b pb-3 mb-4">
            Cumplimiento del Mes
          </h3>
          <div className="relative h-[160px] w-[160px] flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#10b981" /> {/* Completed (Emerald) */}
                  <Cell fill="#f1f5f9" className="dark:fill-slate-800" /> {/* Remaining (Light Gray/Dark slate) */}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-850 dark:text-white leading-none">{complianceRate}%</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Sincronizado</span>
            </div>
          </div>
          <div className="flex gap-6 text-xs font-bold text-slate-500 mt-6 justify-center">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Completado</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-800"></span> Restante</span>
          </div>
        </div>

        {/* Categories Bar chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide border-b pb-3 mb-4">
            Mantenimientos Completados por Categoría de Equipo
          </h3>
          <div className="flex-1 w-full h-[200px] mt-2">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-450 border border-dashed rounded-xl">
                No hay registros de mantenimiento completados para graficar en este período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      fontSize: '11px'
                    }} 
                  />
                  <Bar dataKey="completados" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* --- ATTENTION REQUIRED SECTION --- */}
      {alerts.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/40 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 border-b pb-3 border-slate-150 dark:border-slate-850">
            <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
            Atención Requerida (Vencimientos)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.slice(0, 6).map(alert => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 text-xs transition-shadow hover:shadow-sm ${
                  alert.status === 'vencido'
                    ? 'bg-rose-50/20 border-rose-100 dark:border-rose-950/30'
                    : 'bg-amber-50/20 border-amber-100 dark:border-amber-950/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      alert.status === 'vencido'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {alert.status === 'vencido' ? 'Vencido' : 'Próximo'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{alert.template.frequency}</span>
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-white text-sm mt-2">{alert.equipment.name}</h4>
                  <div className="text-slate-400 text-[10px] mt-1 space-y-0.5">
                    <p>S/N: {alert.equipment.serial_number || 'N/A'}</p>
                    <p>Ubicación: {alert.equipment.location || 'N/A'}</p>
                    <p className="font-semibold text-slate-500">Mantenimiento: {alert.template.name}</p>
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 ${
                  alert.status === 'vencido'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450'
                }`}>
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{alert.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Section */}
      {/* Main Dashboard Section */}
      <div className="space-y-8">
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Schedule Maintenance Form */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 border-b pb-3 border-slate-150 dark:border-slate-850">
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
                    className="custom-input dark:bg-slate-950 dark:border-slate-800 text-sm"
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
                    className="custom-input dark:bg-slate-950 dark:border-slate-800 text-sm"
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
                    className="custom-input dark:bg-slate-950 dark:border-slate-800 text-sm"
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
                    className="custom-input dark:bg-slate-950 dark:border-slate-800 text-sm"
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
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 border-b pb-3 border-slate-150 dark:border-slate-850">
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
                  {checklists?.slice(0, 6).map(chk => (
                    <div key={chk.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-350">{chk.equipment?.name}</h4>
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
          </div>
        )}

        {(!isAdmin || techPending.length > 0) && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 border-b pb-3 border-slate-150 dark:border-slate-850">
              <ClipboardList className="h-5 w-5 text-indigo-500" />
              {isAdmin ? 'Sus Inspecciones Asignadas Pendientes (Como Técnico)' : 'Sus Inspecciones Asignadas Pendientes'}
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

        {/* Assigned Technical Appointments Section (Technicians only) */}
        {profile?.role === 'tecnico' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 border-b pb-3 border-slate-150 dark:border-slate-850">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Sus Citas Asignadas Confirmadas
            </h3>

            {!assignedAppointments || assignedAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-sm">¡Al día! No tiene citas técnicas asignadas pendientes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedAppointments.map(appt => (
                  <div key={appt.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/10 hover:border-slate-200 dark:hover:border-slate-850 flex flex-col justify-between gap-4 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded uppercase">
                          Asignada
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Confirmada: {appt.confirmed_date}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-705 dark:text-white mt-2">
                        {appt.equipment ? appt.equipment.name : 'Inspección de Equipos General'}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                        <p className="font-semibold text-indigo-600">Cliente: {appt.client?.name}</p>
                        {appt.equipment && (
                          <p>S/N: {appt.equipment.serial_number || 'N/A'} • Ubicación: {appt.equipment.location || 'N/A'}</p>
                        )}
                        {appt.description && (
                          <p className="text-slate-400 italic mt-1 bg-slate-50 dark:bg-slate-950 p-1.5 rounded">
                            "{appt.description}"
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/fill?equipment_id=${appt.equipment_id || ''}&appointment_id=${appt.id}`}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      Empezar Inspección / Checklist
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
