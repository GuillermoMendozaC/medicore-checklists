import React, { useRef, useState, useEffect } from 'react'
import { RotateCcw, PenTool } from 'lucide-react'

export default function SignaturePad({ onSave, value }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#312e81' // Indigo 900
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // Draw initial value if exists
    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = value
      setIsEmpty(false)
    }
  }, [value])

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
    setIsEmpty(false)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    saveSignature()
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onSave('')
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Only save if not empty
    if (!isEmpty) {
      const dataUrl = canvas.toDataURL('image/png')
      onSave(dataUrl)
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <PenTool className="h-4 w-4 text-indigo-500" />
          Firma Digital del Técnico *
        </label>
        <button
          type="button"
          onClick={clear}
          className="text-xs flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors font-medium"
        >
          <RotateCcw className="h-3 w-3" />
          Limpiar firma
        </button>
      </div>

      <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-400 transition-all duration-200">
        <canvas
          ref={canvasRef}
          width={450}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[150px] cursor-crosshair touch-none"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-xs text-slate-400 dark:text-slate-600 font-medium">
            Firme aquí con el mouse o pantalla táctil
          </div>
        )}
      </div>
    </div>
  )
}
