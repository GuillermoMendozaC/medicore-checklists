import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  LayoutDashboard, 
  FolderHeart, 
  Stethoscope, 
  FileCheck2, 
  PenTool, 
  History,
  X
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'tecnico'] },
    { to: '/categories', label: 'Categorías', icon: FolderHeart, roles: ['admin'] },
    { to: '/equipment', label: 'Equipos Médicos', icon: Stethoscope, roles: ['admin', 'tecnico'] },
    { to: '/templates', label: 'Plantillas Checklist', icon: FileCheck2, roles: ['admin'] },
    { to: '/fill', label: 'Llenar Checklist', icon: PenTool, roles: ['tecnico'] },
    { to: '/history', label: 'Historial Checklists', icon: History, roles: ['admin', 'tecnico'] }
  ]

  const activeStyle = "flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all duration-200"
  const inactiveStyle = "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800/50 font-medium transition-all duration-200"

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 lg:sticky lg:top-[77px] lg:h-[calc(100vh-77px)]
        glass-panel bg-white/80 dark:bg-slate-900/80 border-r border-slate-200/50 dark:border-slate-800/50
        flex flex-col justify-between py-6 px-4
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between lg:hidden px-2">
            <span className="font-bold text-slate-800 dark:text-white">Menú MediCore</span>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {links
              .filter(link => link.roles.includes(profile?.role))
              .map(link => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </NavLink>
                )
              })}
          </nav>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800/40 dark:to-slate-800/10 p-4 border border-indigo-100/50 dark:border-slate-800/30">
          <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider mb-1">MediCore Cloud</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Gestión certificada de mantenimiento y auditoría de equipos médicos.
          </p>
        </div>
      </aside>
    </>
  )
}
