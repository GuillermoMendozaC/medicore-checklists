import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  const signUp = async (email, password, fullName, role = 'tecnico') => {
    setLoading(true)
    // 1. Auth SignUp
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    })

    if (signUpError) {
      setLoading(false)
      throw signUpError
    }

    if (data?.user) {
      // 2. Insert profile record (RLS and Schema setup)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          role: role
        })

      if (profileError) {
        console.error("Error creating profile record:", profileError)
      }
    }
    
    return data
  }

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    signUp,
    isLoggedIn: !!user,
    isAdmin: profile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
