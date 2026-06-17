import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Clock, LogOut, ShieldAlert } from 'lucide-react'

export default function PendingApproval() {
  const { logout, profile } = useAuth()

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl text-center space-y-6 relative overflow-hidden animate-fade-in">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

        <div className="h-16 w-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg shadow-amber-600/10">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2 relative">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Aprobación Pendiente</h2>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Hola, {profile?.full_name || 'Usuario'}
          </p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            Tu cuenta ha sido creada exitosamente pero se encuentra en estado **pendiente**. 
            Un administrador de MediCore debe asignarte un rol (Administrador, Técnico o Cliente) para poder acceder a la plataforma.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 relative">
          <button
            onClick={logout}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
