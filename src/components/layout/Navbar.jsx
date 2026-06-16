import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { LogOut, User, Activity, Menu } from 'lucide-react'
import OfflineIndicator from './OfflineIndicator'

export default function Navbar({ onToggleSidebar }) {
  const { profile, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 dark:text-white leading-none">MediCore</h1>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase">Sistemas de Salud</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <OfflineIndicator />
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{profile?.full_name}</span>
          <span className="text-xs text-slate-400 font-medium capitalize flex items-center gap-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${profile?.role === 'admin' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
            {profile?.role === 'admin' ? 'Administrador' : 'Técnico de Soporte'}
          </span>
        </div>

        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-inner">
          <User className="h-4 w-4" />
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
