import React from 'react'

export function Button({ className, children, variant = 'primary', ...props }) {
  const base = "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10",
    secondary: "bg-slate-100 text-slate-950 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/10",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
}
