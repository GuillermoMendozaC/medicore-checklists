import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useEquipment() {
  const queryClient = useQueryClient()

  // --- CATEGORIES ---
  
  const useCategories = () => {
    return useQuery({
      queryKey: ['equipment_categories'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('equipment_categories')
          .select('*')
          .order('name', { ascending: true })
        if (error) throw error
        return data
      }
    })
  }

  const useCreateCategory = () => {
    return useMutation({
      mutationFn: async (name) => {
        const { data, error } = await supabase
          .from('equipment_categories')
          .insert({ name })
        if (error) throw error
        return data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['equipment_categories'] })
      }
    })
  }

  const useUpdateCategory = () => {
    return useMutation({
      mutationFn: async ({ id, name }) => {
        const { data, error } = await supabase
          .from('equipment_categories')
          .update({ name })
          .eq('id', id)
        if (error) throw error
        return data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['equipment_categories'] })
      }
    })
  }

  const useDeleteCategory = () => {
    return useMutation({
      mutationFn: async (id) => {
        const { error } = await supabase
          .from('equipment_categories')
          .delete()
          .eq('id', id)
        if (error) throw error
        return true
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['equipment_categories'] })
      }
    })
  }

  // --- EQUIPMENT ---

  const useEquipmentList = () => {
    return useQuery({
      queryKey: ['equipment'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('equipment')
          .select('*, category:equipment_categories(*), client:clients(*)')
          .order('name', { ascending: true })
        if (error) throw error
        return data
      }
    })
  }

  const useCreateEquipment = () => {
    return useMutation({
      mutationFn: async (newEq) => {
        const { data, error } = await supabase
          .from('equipment')
          .insert(newEq)
        if (error) throw error
        return data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['equipment'] })
      }
    })
  }

  const useUpdateEquipment = () => {
    return useMutation({
      mutationFn: async ({ id, updates }) => {
        const { data, error } = await supabase
          .from('equipment')
          .update(updates)
          .eq('id', id)
        if (error) throw error
        return data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['equipment'] })
      }
    })
  }

  const useDeleteEquipment = () => {
    return useMutation({
      mutationFn: async (id) => {
        const { error } = await supabase
          .from('equipment')
          .delete()
          .eq('id', id)
        if (error) throw error
        return true
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['equipment'] })
      }
    })
  }

  return {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useEquipmentList,
    useCreateEquipment,
    useUpdateEquipment,
    useDeleteEquipment
  }
}
