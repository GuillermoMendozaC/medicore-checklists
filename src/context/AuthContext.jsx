import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { syncPendingChecklists, syncMetadataToDexie } from '../lib/sync'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }
      
      return data && data.length > 0 ? data[0] : null
    } catch (err) {
      console.error("Failed to load profile:", err)
      return null
    }
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        const prof = await fetchProfile(session.user.id)
        setProfile(prof)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true)
      if (session) {
        setUser(session.user)
        const prof = await fetchProfile(session.user.id)
        setProfile(prof)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Synchronization and local caching lifecycle
  useEffect(() => {
    if (loading || !user) return

    // Run synchronization immediately if online
    if (navigator.onLine) {
      syncPendingChecklists(user.id).then(() => {
        syncMetadataToDexie(user.id)
      })
    }

    // Trigger sync when connection is restored
    const handleOnline = () => {
      syncPendingChecklists(user.id).then(() => {
        syncMetadataToDexie(user.id)
      })
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [user, loading])

  const login = async (email, password) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setLoading(false)
      throw error
    }
    return data
  }

  const logout = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLoading(false)
      throw error
    }
    
    // Clear local Dexie cache on logout
    try {
      const { db } = await import('../lib/db')
      await db.transaction('rw', db.equipment, db.checklist_templates, db.checklist_template_items, async () => {
        await db.equipment.clear()
        await db.checklist_templates.clear()
        await db.checklist_template_items.clear()
      })
    } catch (e) {
      console.warn("Failed to clear local Dexie cache on logout:", e)
    }

    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  const signUp = async (email, password, fullName, role = 'tecnico', clinicNameOrId = null) => {
    setLoading(true)
    // 1. Auth SignUp
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    })

    if (signUpError) {
      setLoading(false)
      throw signUpError
    }

    if (data?.user) {
      let client_id = null

      if (role === 'cliente' && clinicNameOrId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicNameOrId)
        if (isUuid) {
          client_id = clinicNameOrId
        } else {
          // Generate a UUID on the client side to avoid RLS select restrictions during insert
          const generatedClientId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });

          const { error: clientErr } = await supabase
            .from('clients')
            .insert({ id: generatedClientId, name: clinicNameOrId })
          
          if (clientErr) {
            setLoading(false)
            throw clientErr
          }
          client_id = generatedClientId
        }
      }

      // 2. Insert profile record (RLS and Schema setup)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          role: role,
          client_id: client_id
        })

      if (profileError) {
        console.error("Error creating profile record:", profileError)
      }
    }
    
    return data
  }

  const reloadProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.id)
      setProfile(prof)
      return prof
    }
    return null
  }

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    signUp,
    reloadProfile,
    isLoggedIn: !!user,
    isAdmin: profile?.role === 'admin',
    isCliente: profile?.role === 'cliente',
    isTecnico: profile?.role === 'tecnico'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
