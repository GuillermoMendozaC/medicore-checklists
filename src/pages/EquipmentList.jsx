import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useEquipment } from '../hooks/useEquipment'
import EquipmentListComp from '../components/equipment/EquipmentList'
import EquipmentForm from '../components/equipment/EquipmentForm'
import { Stethoscope, Plus, HelpCircle, ShieldAlert } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function EquipmentList() {
  const { isAdmin } = useAuth()
  const { 
    useCategories, 
    useEquipmentList, 
    useCreateEquipment, 
    useUpdateEquipment, 
    useDeleteEquipment 
  } = useEquipment()

  const { data: equipmentList, isLoading: isEqLoading, isError: isEqError, error: eqError } = useEquipmentList()
  const { data: categories, isLoading: isCatLoading } = useCategories()
  
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    }
  })
  
  const createMutation = useCreateEquipment()
  const updateMutation = useUpdateEquipment()
  const deleteMutation = useDeleteEquipment()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleOpenCreate = () => {
    setEditingEquipment(null)
    setIsFormOpen(true)
    setErrorMsg('')
  }

  const handleOpenEdit = (eq) => {
    setEditingEquipment(eq)
    setIsFormOpen(true)
    setErrorMsg('')
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingEquipment(null)
  }

  const handleFormSubmit = async (formData) => {
    setErrorMsg('')
    try {
      if (editingEquipment) {
        await updateMutation.mutateAsync({
          id: editingEquipment.id,
          updates: formData
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      setIsFormOpen(false)
      setEditingEquipment(null)
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el equipo.')
    }
  }

  const handleDelete = async (id) => {
    setErrorMsg('')
    try {
      await deleteMutation.mutateAsync(id)
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar el equipo.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Inventario de Equipos Médicos</h2>
          <p className="text-sm text-slate-500">
            {isAdmin 
              ? 'Administre el registro y estado operativo de equipos clínicos.' 
              : 'Consulte el catálogo y estado operativo de equipos clínicos.'}
          </p>
        </div>
        {isAdmin && !isFormOpen && (
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-200 self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" />
            Nuevo Equipo
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Slide down form panel */}
      {isFormOpen && isAdmin && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800/80 shadow-md space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">
              {editingEquipment ? `Editar: ${editingEquipment.name}` : 'Registrar Nuevo Equipo'}
            </h3>
          </div>
          
          <EquipmentForm
            initialValues={editingEquipment}
            categories={categories || []}
            clients={clients || []}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* Main equipment list */}
      {isEqLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : isEqError ? (
        <div className="p-8 text-center text-rose-500 bg-white dark:bg-slate-900 border rounded-2xl">
          Error al cargar equipos: {eqError.message}
        </div>
      ) : (
        <EquipmentListComp
          equipmentList={equipmentList || []}
          categories={categories || []}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
