import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useChecklists() {
  const queryClient = useQueryClient()

  const useChecklistsList = (filters = {}) => {
    return useQuery({
      queryKey: ['maintenance_checklists', filters],
      queryFn: async () => {
        let query = supabase
          .from('maintenance_checklists')
          .select('*, equipment:equipment(*, category:equipment_categories(*)), template:checklist_templates(*), technician:profiles(*)')
          
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.technician_id) {
          query = query.eq('technician_id', filters.technician_id)
        }
        if (filters.equipment_id) {
          query = query.eq('equipment_id', filters.equipment_id)
        }
        if (filters.start_date) {
          query = query.gte('scheduled_date', filters.start_date)
        }
        if (filters.end_date) {
          query = query.lte('scheduled_date', filters.end_date)
        }

        const { data, error } = await query.order('scheduled_date', { ascending: false })
        if (error) throw error
        return data
      }
    })
  }

  const useChecklist = (id) => {
    return useQuery({
      queryKey: ['maintenance_checklist', id],
      queryFn: async () => {
        if (!id) return null
        const { data, error } = await supabase
          .from('maintenance_checklists')
          .select('*, equipment:equipment(*, category:equipment_categories(*)), template:checklist_templates(*), technician:profiles(*)')
          .eq('id', id)
          .single()
        if (error) throw error
        return data
      },
      enabled: !!id
    })
  }

  const useCreateChecklist = () => {
    return useMutation({
      mutationFn: async (newChecklist) => {
        const { data, error } = await supabase
          .from('maintenance_checklists')
          .insert(newChecklist)
          .select()
        if (error) throw error
        return data && data[0]
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['maintenance_checklists'] })
      }
    })
  }

  const useDeleteChecklist = () => {
    return useMutation({
      mutationFn: async (id) => {
        // Delete responses first
        await supabase
          .from('checklist_responses')
          .delete()
          .eq('checklist_id', id)

        const { error } = await supabase
          .from('maintenance_checklists')
          .delete()
          .eq('id', id)
        if (error) throw error
        return true
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['maintenance_checklists'] })
      }
    })
  }

  const useCompleteChecklist = () => {
    return useMutation({
      mutationFn: async ({ id, general_notes, signature_url, responses }) => {
        // 1. Save all responses
        if (responses && responses.length > 0) {
          // Delete existing responses first if any (in case of draft, though normally done once)
          await supabase
            .from('checklist_responses')
            .delete()
            .eq('checklist_id', id)

          const { error: responseErr } = await supabase
            .from('checklist_responses')
            .insert(
              responses.map(r => ({
                checklist_id: id,
                template_item_id: r.template_item_id,
                value: String(r.value),
                notes: r.notes || null,
                photo_url: r.photo_url || null
              }))
            )
          if (responseErr) throw responseErr
        }

        // 2. Update checklist status
        const { data, error } = await supabase
          .from('maintenance_checklists')
          .update({
            status: 'completado',
            general_notes,
            signature_url,
            completed_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()

        if (error) throw error
        return data && data[0]
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['maintenance_checklists'] })
        queryClient.invalidateQueries({ queryKey: ['maintenance_checklist', variables.id] })
        queryClient.invalidateQueries({ queryKey: ['checklist_responses', variables.id] })
      }
    })
  }

  // --- RESPONSES ---

  const useChecklistResponses = (checklistId) => {
    return useQuery({
      queryKey: ['checklist_responses', checklistId],
      queryFn: async () => {
        if (!checklistId) return []
        const { data, error } = await supabase
          .from('checklist_responses')
          .select('*, template_item:checklist_template_items(*)')
          .eq('checklist_id', checklistId)
        if (error) throw error
        return data
      },
      enabled: !!checklistId
    })
  }

  const useTechnicians = () => {
    return useQuery({
      queryKey: ['profiles_technicians'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'tecnico')
          .order('full_name', { ascending: true })
        if (error) throw error
        return data
      }
    })
  }

  return {
    useChecklistsList,
    useChecklist,
    useCreateChecklist,
    useDeleteChecklist,
    useCompleteChecklist,
    useChecklistResponses,
    useTechnicians
  }
}
