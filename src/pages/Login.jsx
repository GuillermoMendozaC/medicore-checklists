import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, LogIn, Info, Check } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoggedIn, profile } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isLoggedIn && profile) {
      if (profile.role === 'cliente') {
        navigate('/portal/equipos')
      } else if (profile.role === 'pendiente') {
        navigate('/pendiente')
      } else {
        navigate('/')
      }
    }
  }, [isLoggedIn, profile, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la autenticación')
      setLoading(false)
    }
  }

  // Quick credentials loader helper
  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail)
    setPassword(quickPassword)
    setErrorMsg('')
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden animate-fade-in">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>

        <div className="flex flex-col items-center text-center space-y-2 relative">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Activity className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white pt-2">MediCore Portal</h2>
          <p className="text-sm text-slate-500 max-w-xs leading-normal">
            Gestión y Control de Mantenimiento de Equipamiento Médico
          </p>
        </div>

        {/* Message banners */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-400 text-xs font-semibold flex items-start gap-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400 text-xs font-semibold flex items-start gap-2">
            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="custom-label">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@medicore.com"
              className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="custom-label">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:shadow-indigo-600/35 transition-all duration-200"
          >
            <LogIn className="h-4.5 w-4.5" />
            {loading ? 'Procesando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 pt-2">
          <Link
            to="/registro"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            ¿Eres una clínica nueva? Regístrate aquí
          </Link>
          <Link
            to="/registro-tecnico"
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 hover:underline"
          >
            ¿Eres técnico? Regístrate aquí de forma individual
          </Link>
        </div>


        {/* Quick Credentials panel (Demo helper) - Only show if Supabase is NOT configured */}
        {!import.meta.env.VITE_SUPABASE_URL && (
          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2 relative">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
              Credenciales de Demostración (Demo Mode)
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@medicore.com', 'admin123')}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">ADMIN</span>
                <span className="text-[9px] font-medium leading-none text-slate-400 truncate w-full text-center">admin@medicore.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('tecnico@medicore.com', 'tecnico123')}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">TÉCNICO</span>
                <span className="text-[9px] font-medium leading-none text-slate-400 truncate w-full text-center">tecnico@medicore.com</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
