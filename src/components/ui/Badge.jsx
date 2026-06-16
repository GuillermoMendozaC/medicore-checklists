import React from 'react'

export function Badge({ className, children, variant = 'default', ...props }) {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-indigo-600 text-white shadow hover:bg-indigo-600/80",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-100",
    destructive: "border-transparent bg-rose-600 text-white shadow hover:bg-rose-600/80",
    outline: "text-foreground"
  }

  return (
    <div className={`${base} ${variants[variant]} ${className || ''}`} {...props}>
      {children}
    </div>
  )
}
