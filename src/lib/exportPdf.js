import { jsPDF } from 'jspdf'

// Helper to load image as base64 safely
const loadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null) // resolve null on error so PDF still generates
    img.src = url
  })
}

export const exportChecklistToPdf = async (chk, responses) => {
  const doc = new jsPDF()

  // Draw Header
  doc.setFillColor(49, 46, 129) // Indigo 900
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('MEDICORE SYSTEMS', 15, 18)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Reporte de Inspección y Mantenimiento Técnico', 15, 25)
  doc.text(`ID Reporte: ${chk.id}`, 15, 32)

  // Document Title
  doc.setTextColor(30, 41, 59) // Slate 800
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('INFORME DE MANTENIMIENTO CLÍNICO', 15, 52)
  
  // Equipment Info Box
  doc.setDrawColor(226, 232, 240) // Slate 200
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.roundedRect(15, 58, 180, 42, 3, 3, 'FD')

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139) // Slate 500
  doc.text('DETALLES DEL DISPOSITIVO MÉDICO', 20, 65)

  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.text('Equipo:', 20, 72)
  doc.setFont('helvetica', 'normal')
  doc.text(chk.equipment?.name || 'N/A', 50, 72)

  doc.setFont('helvetica', 'bold')
  doc.text('Marca / Modelo:', 20, 78)
  doc.setFont('helvetica', 'normal')
  doc.text(`${chk.equipment?.brand || 'N/A'} / ${chk.equipment?.model || 'N/A'}`, 50, 78)

  doc.setFont('helvetica', 'bold')
  doc.text('Número de Serie:', 20, 84)
  doc.setFont('helvetica', 'normal')
  doc.text(chk.equipment?.serial_number || 'N/A', 50, 84)

  doc.setFont('helvetica', 'bold')
  doc.text('Ubicación:', 20, 90)
  doc.setFont('helvetica', 'normal')
  doc.text(chk.equipment?.location || 'N/A', 50, 90)

  doc.setFont('helvetica', 'bold')
  doc.text('Estado Operativo:', 20, 96)
  doc.setFont('helvetica', 'normal')
  doc.text(chk.equipment?.status === 'activo' ? 'Activo' : (chk.equipment?.status === 'inactivo' ? 'Inactivo' : 'En Reparación'), 50, 96)

  // Maintenance Info Box
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(15, 106, 180, 24, 3, 3, 'FD')

  doc.setTextColor(100, 116, 139)
  doc.text('INFORMACIÓN OPERATIVA', 20, 112)

  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.text('Técnico Responsable:', 20, 119)
  doc.setFont('helvetica', 'normal')
  doc.text(chk.technician?.full_name || 'N/A', 62, 119)

  doc.setFont('helvetica', 'bold')
  doc.text('Fecha Completado:', 20, 125)
  doc.setFont('helvetica', 'normal')
  doc.text(chk.completed_at ? new Date(chk.completed_at).toLocaleString() : chk.scheduled_date, 62, 125)

  // Table of responses
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('EVALUACIÓN DE ÍTEMS', 15, 140)

  // Header line
  doc.setDrawColor(79, 70, 229) // Indigo 600
  doc.setLineWidth(0.8)
  doc.line(15, 143, 195, 143)

  let y = 150
  doc.setFontSize(9)
  doc.setLineWidth(0.2)
  doc.setDrawColor(226, 232, 240)

  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i]
    
    // Check page overflow
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(`${resp.template_item?.sort_order || i + 1}. ${resp.template_item?.label || 'Ítem'}`, 15, y)
    
    // Draw Value (PASA / FALLA or text)
    let valText = resp.value
    let isPasa = false
    let isFalla = false
    if (resp.template_item?.item_type === 'boolean') {
      isPasa = resp.value === 'true'
      isFalla = resp.value === 'false'
      valText = isPasa ? 'PASA' : 'FALLA'
    }

    doc.setFont('helvetica', 'bold')
    if (isPasa) doc.setTextColor(16, 185, 129) // Green
    else if (isFalla) doc.setTextColor(244, 63, 94) // Red
    else doc.setTextColor(79, 70, 229) // Indigo

    doc.text(valText || 'N/A', 170, y)

    // Optional item notes
    if (resp.notes) {
      y += 5
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100, 116, 139)
      doc.text(`Nota: ${resp.notes}`, 20, y)
    }

    // Optional item photo evidence
    if (resp.photo_url) {
      y += 5
      const photoBase64 = await loadImage(resp.photo_url)
      if (photoBase64) {
        doc.addImage(photoBase64, 'JPEG', 20, y, 40, 30)
        y += 32
      } else {
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(244, 63, 94)
        doc.text('[Foto de evidencia no disponible para descarga]', 20, y)
        y += 4
      }
    }

    y += 8
    doc.line(15, y - 4, 195, y - 4)
  }

  // Check page overflow for notes and signature
  if (y > 220) {
    doc.addPage()
    y = 20
  }

  // General notes
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text('OBSERVACIONES GENERALES', 15, y + 10)
  
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(chk.general_notes || 'Sin observaciones generales.', 15, y + 16, { maxWidth: 180 })

  y += 35

  // Signature Block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('FIRMA DEL TÉCNICO RESPONSABLE', 120, y + 5)

  if (chk.signature_url) {
    const sigBase64 = await loadImage(chk.signature_url)
    if (sigBase64) {
      doc.addImage(sigBase64, 'PNG', 120, y + 10, 60, 20)
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(244, 63, 94)
      doc.text('[Firma digital no disponible]', 120, y + 15)
    }
  }

  doc.setLineWidth(0.4)
  doc.setDrawColor(148, 163, 184)
  doc.line(120, y + 32, 190, y + 32)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(chk.technician?.full_name || 'Firma autorizada', 120, y + 37)

  // Save the PDF
  doc.save(`Reporte_Mantenimiento_${chk.equipment?.name || 'Equipo'}_${chk.scheduled_date}.pdf`)
}
