import { supabase } from './supabase'
import { db } from './db'

// Mutex flag to prevent concurrent sync operations
let isSyncing = false

/**
 * Converts a Blob or File object to a base64 Data URL.
 * Used for local previews and mock mode storage.
 */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Converts a base64 Data URL to a Blob.
 */
export async function dataURLtoBlob(dataUrl) {
  const response = await fetch(dataUrl)
  return await response.blob()
}

/**
 * Downloads active metadata from Supabase and populates local Dexie cache.
 * Syncs active equipment, templates, template items, and pending checklists assigned to the technician.
 */
export async function syncMetadataToDexie(userId) {
  if (!userId) {
    console.log("No user ID provided. Skipping metadata sync.")
    return
  }
  if (!navigator.onLine) {
    console.log("Offline. Skipping metadata cache sync.")
    return
  }

  console.log(`Syncing metadata and pending tasks for technician ${userId} into Dexie...`)

  try {
    // 1. Fetch active equipment
    const { data: equipment, error: eqError } = await supabase
      .from('equipment')
      .select('*')
      .eq('status', 'activo')
    if (eqError) throw eqError

    // 2. Fetch all templates
    const { data: templates, error: tempError } = await supabase
      .from('checklist_templates')
      .select('*')
    if (tempError) throw tempError

    // 3. Fetch all template items
    const { data: items, error: itemsError } = await supabase
      .from('checklist_template_items')
      .select('*')
    if (itemsError) throw itemsError

    // 4. Fetch scheduled checklists for this technician
    const { data: pendingChecklists, error: chkError } = await supabase
      .from('maintenance_checklists')
      .select('*')
      .eq('status', 'pendiente')
      .eq('technician_id', userId)
    if (chkError) throw chkError

    // Perform database transaction to atomically replace cache
    await db.transaction('rw', db.equipment, db.checklist_templates, db.checklist_template_items, db.pending_checklists, async () => {
      // Refresh equipment
      await db.equipment.clear()
      if (equipment && equipment.length > 0) {
        await db.equipment.bulkPut(equipment)
      }

      // Refresh templates
      await db.checklist_templates.clear()
      if (templates && templates.length > 0) {
        await db.checklist_templates.bulkPut(templates)
      }

      // Refresh template items
      await db.checklist_template_items.clear()
      if (items && items.length > 0) {
        await db.checklist_template_items.bulkPut(items)
      }

      // Sync scheduled checklists:
      // We must preserve completed checklists waiting in the local queue ('completado')
      const localCompletados = await db.pending_checklists.where('status').equals('completado').toArray()
      
      await db.pending_checklists.clear()
      
      // Save newly downloaded scheduled checklists ('pendiente')
      if (pendingChecklists && pendingChecklists.length > 0) {
        // Exclude any scheduled checklists that the technician has already completed locally
        const filteredPending = pendingChecklists.filter(rc => !localCompletados.some(lc => lc.id === rc.id))
        await db.pending_checklists.bulkPut(filteredPending)
      }

      // Restore local completed checklists
      if (localCompletados.length > 0) {
        await db.pending_checklists.bulkPut(localCompletados)
      }
    })

    console.log("Dexie local cache sync complete.")
  } catch (err) {
    console.error("Error syncing metadata to Dexie:", err)
  }
}

/**
 * Uploads all completed checklists and response records currently queued in Dexie to Supabase.
 * Uploads media blobs (photos/signatures) to Supabase Storage bucket 'checklist-media' first.
 */
export async function syncPendingChecklists(userId) {
  if (isSyncing) return
  if (!navigator.onLine) {
    console.log("No network connection. Skipping queue synchronization.")
    return
  }

  isSyncing = true
  console.log("Sincronización: Iniciando carga de checklists pendientes...")

  try {
    // Find all completed checklists in local queue
    const completedChecklists = await db.pending_checklists
      .where('status')
      .equals('completado')
      .toArray()

    if (completedChecklists.length === 0) {
      console.log("Sincronización: No hay checklists en cola para sincronizar.")
      return
    }

    for (const checklist of completedChecklists) {
      const checklistId = checklist.id
      console.log(`Sincronizando checklist ID: ${checklistId}...`)

      try {
        let signatureUrl = checklist.signature_url

        // 1. Upload signature blob if present
        if (checklist.signature_blob) {
          const filePath = `signatures/${checklistId}.png`
          
          if (supabase.storage) {
            console.log(`Sincronización: Subiendo firma para ${checklistId}...`)
            const { error: uploadErr } = await supabase.storage
              .from('checklist-media')
              .upload(filePath, checklist.signature_blob, { upsert: true })
            
            if (uploadErr) throw uploadErr

            const { data: { publicUrl } } = supabase.storage
              .from('checklist-media')
              .getPublicUrl(filePath)
            
            signatureUrl = publicUrl
          } else {
            // Mock Mode: Convert signature blob back to Data URL
            signatureUrl = await blobToDataURL(checklist.signature_blob)
          }
        }

        // 2. Fetch local responses for this checklist
        const responses = await db.pending_responses
          .where('checklist_id')
          .equals(checklistId)
          .toArray()

        // 3. Process responses and upload photo blobs if present
        const processedResponses = []
        for (const resp of responses) {
          let photoUrl = resp.photo_url

          if (resp.photo_blob) {
            const filePath = `photos/${checklistId}_${resp.template_item_id}.jpg`

            if (supabase.storage) {
              console.log(`Sincronización: Subiendo foto para ítem ${resp.template_item_id}...`)
              const { error: uploadErr } = await supabase.storage
                .from('checklist-media')
                .upload(filePath, resp.photo_blob, { upsert: true })

              if (uploadErr) throw uploadErr

              const { data: { publicUrl } } = supabase.storage
                .from('checklist-media')
                .getPublicUrl(filePath)

              photoUrl = publicUrl
            } else {
              // Mock Mode: Convert photo blob to Data URL
              photoUrl = await blobToDataURL(resp.photo_blob)
            }
          }

          processedResponses.push({
            checklist_id: checklistId,
            template_item_id: resp.template_item_id,
            value: String(resp.value),
            notes: resp.notes || null,
            photo_url: photoUrl || null
          })
        }

        // 4. Upsert completed checklist record to Supabase
        // Sanitize UUID fields: convert empty strings to null to avoid Postgres UUID parse errors
        const checklistPayload = {
          id: checklist.id,
          equipment_id: checklist.equipment_id || null,
          template_id: checklist.template_id || null,
          technician_id: checklist.technician_id || null,
          scheduled_date: checklist.scheduled_date,
          completed_at: checklist.completed_at,
          status: 'completado',
          general_notes: checklist.general_notes || null,
          signature_url: signatureUrl || null,
          appointment_id: checklist.appointment_id || null
        }

        console.log(`Sincronización: Insertando/Actualizando checklist en Supabase...`)
        const { error: chkError } = await supabase
          .from('maintenance_checklists')
          .upsert(checklistPayload)
        
        if (chkError) throw chkError

        // Update linked appointment status to 'completada'
        if (checklist.appointment_id) {
          console.log(`Sincronización: Actualizando estado de la cita ${checklist.appointment_id} a 'completada'...`)
          const { error: apptError } = await supabase
            .from('appointments')
            .update({ status: 'completada' })
            .eq('id', checklist.appointment_id)
          if (apptError) {
            console.error(`Sincronización: Error al actualizar estado de la cita ${checklist.appointment_id}:`, apptError)
          }
        }

        // 5. Insert responses to Supabase
        if (processedResponses.length > 0) {
          console.log(`Sincronización: Guardando ${processedResponses.length} respuestas en Supabase...`)
          
          // Clear any remote responses for this checklist first to avoid constraint/duplicate errors
          await supabase
            .from('checklist_responses')
            .delete()
            .eq('checklist_id', checklistId)

          const { error: respError } = await supabase
            .from('checklist_responses')
            .insert(processedResponses)

          if (respError) throw respError
        }

        // 6. Delete records from Dexie once successfully synchronized
        await db.transaction('rw', db.pending_checklists, db.pending_responses, async () => {
          await db.pending_checklists.delete(checklistId)
          await db.pending_responses.where('checklist_id').equals(checklistId).delete()
        })

        console.log(`Checklist ${checklistId} sincronizado y limpiado localmente con éxito.`)
      } catch (err) {
        console.error(`Error sincronizando el checklist ${checklistId}:`, err)
      }
    }

    // 7. Re-sync local metadata state if userId is provided to pull fresh lists
    if (userId) {
      await syncMetadataToDexie(userId)
    }
  } catch (err) {
    console.error("Error durante el proceso de sincronización:", err)
  } finally {
    isSyncing = false
  }
}
