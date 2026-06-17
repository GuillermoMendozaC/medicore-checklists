import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Activity, UserPlus, Info, Check, ArrowLeft, User, Mail, Lock } from 'lucide-react'

export default function SignupTechnician() {
  const navigate = useNavigate()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCheckEmail, setShowCheckEmail] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim()
            // No 'signup_type' equals to default 'pendiente' role in Supabase trigger handle_new_user()
          }
        }
      })

      if (error) throw error

      if (data?.user && !data.session) {
        setShowCheckEmail(true)
        setSuccessMsg('¡Usuario registrado! Por favor, verifica tu correo electrónico.')
      } else {
        setSuccessMsg('¡Registro exitoso! Su cuenta está pendiente de aprobación.')
        setTimeout(() => {
          navigate('/pendiente')
        }, 1500)
      }
    } catch (err) {
      console.error("Technician signup error:", err)
      const msg = err && typeof err === 'object'
        ? err.message || (typeof err.error === 'string' ? err.error : JSON.stringify(err))
        : String(err)
      setErrorMsg(msg || 'Error al procesar el registro')
      setLoading(false)
    }

  }

  if (showCheckEmail) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl text-center space-y-6 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
          <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white pt-2">Verifica tu Correo</h2>
          <p className="text-sm text-slate-500 leading-relaxed text-center">
            Hemos enviado un enlace de confirmación a <strong className="text-slate-700 dark:text-slate-350">{email}</strong>.
            Por favor, revisa tu bandeja de entrada y spam para activar tu cuenta.
          </p>
          <div className="pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden animate-fade-in">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>

        <div className="flex flex-col items-center text-center space-y-2 relative">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white pt-2">Registro de Técnico</h2>
          <p className="text-sm text-slate-500 max-w-xs leading-normal">
            Cree su cuenta técnica para ingresar a la plataforma y rellenar checklists.
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
            <label className="custom-label flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Ing. Pedro Picapiedra"
              className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="custom-label flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tecnico@correo.com"
              className="custom-input dark:bg-slate-900 dark:border-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="custom-label flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Contraseña *
            </label>
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
            <UserPlus className="h-4.5 w-4.5" />
            {loading ? 'Registrando...' : 'Registrar Cuenta'}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 hover:underline"
          >
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
