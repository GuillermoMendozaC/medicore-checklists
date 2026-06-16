import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useTemplates() {
  const queryClient = useQueryClient()

  // --- TEMPLATES ---

  const useTemplatesList = () => {
    return useQuery({
      queryKey: ['checklist_templates'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('checklist_templates')
          .select('*, category:equipment_categories(*)')
          .order('name', { ascending: true })
        if (error) throw error
        return data
      }
    })
  }

  const useTemplate = (id) => {
    return useQuery({
      queryKey: ['checklist_template', id],
      queryFn: async () => {
        if (!id) return null
        const { data, error } = await supabase
          .from('checklist_templates')
          .select('*, category:equipment_categories(*)')
          .eq('id', id)
          .single()
        if (error) throw error
        return data
      },
      enabled: !!id
    })
  }

  const useCreateTemplate = () => {
    return useMutation({
      mutationFn: async ({ category_id, name, frequency }) => {
        const { data, error } = await supabase
          .from('checklist_templates')
          .insert({ category_id, name, frequency })
          .select()
        if (error) throw error
        return data && data[0]
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['checklist_templates'] })
      }
    })
  }

  const useUpdateTemplate = () => {
    return useMutation({
      mutationFn: async ({ id, updates }) => {
        const { data, error } = await supabase
          .from('checklist_templates')
          .update(updates)
          .eq('id', id)
          .select()
        if (error) throw error
        return data && data[0]
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['checklist_templates'] })
        queryClient.invalidateQueries({ queryKey: ['checklist_template', variables.id] })
      }
    })
  }

  const useDeleteTemplate = () => {
    return useMutation({
      mutationFn: async (id) => {
        // First delete all template items to satisfy references, if not cascade
        await supabase
          .from('checklist_template_items')
          .delete()
          .eq('template_id', id)

        const { error } = await supabase
          .from('checklist_templates')
          .delete()
          .eq('id', id)
        if (error) throw error
        return true
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['checklist_templates'] })
      }
    })
  }

  // --- TEMPLATE ITEMS ---

  const useTemplateItems = (templateId) => {
    return useQuery({
      queryKey: ['checklist_template_items', templateId],
      queryFn: async () => {
        if (!templateId) return []
        const { data, error } = await supabase
          .from('checklist_template_items')
          .select('*')
          .eq('template_id', templateId)
          .order('sort_order', { ascending: true })
        if (error) throw error
        return data
      },
      enabled: !!templateId
    })
  }

  const useCreateTemplateItem = () => {
    return useMutation({
      mutationFn: async (newItem) => {
        const { data, error } = await supabase
          .from('checklist_template_items')
          .insert(newItem)
          .select()
        if (error) throw error
        return data && data[0]
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['checklist_template_items', variables.template_id] })
      }
    })
  }

  const useUpdateTemplateItem = () => {
    return useMutation({
      mutationFn: async ({ id, template_id, updates }) => {
        const { data, error } = await supabase
          .from('checklist_template_items')
          .update(updates)
          .eq('id', id)
          .select()
        if (error) throw error
        return data && data[0]
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['checklist_template_items', variables.template_id] })
      }
    })
  }

  const useDeleteTemplateItem = () => {
    return useMutation({
      mutationFn: async ({ id, template_id }) => {
        const { error } = await supabase
          .from('checklist_template_items')
          .delete()
          .eq('id', id)
        if (error) throw error
        return true
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['checklist_template_items', variables.template_id] })
      }
    })
  }

  return {
    useTemplatesList,
    useTemplate,
    useCreateTemplate,
    useUpdateTemplate,
    useDeleteTemplate,
    useTemplateItems,
    useCreateTemplateItem,
    useUpdateTemplateItem,
    useDeleteTemplateItem
  }
}
