import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY


// Verify configuration
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== "" && 
  supabaseAnonKey.trim() !== "" &&
  supabaseUrl.startsWith('https://')

let supabaseClient

if (isConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // --- MOCK DATABASE IMPLEMENTATION FOR DEMO MODE ---
  console.warn("MediCore: Supabase keys not detected or invalid. Running in MOCK/DEMO MODE (data persisted in LocalStorage).")

  // Seed default data if not present
  const initStorage = () => {
    const defaultCategories = [
      { id: "cat-1", name: "Monitores de Signos Vitales" },
      { id: "cat-2", name: "Autoclaves" },
      { id: "cat-3", name: "Equipos Odontológicos" }
    ]

    const defaultEquipment = [
      { 
        id: "eq-1", 
        category_id: "cat-1", 
        name: "Monitor Multiparámetro", 
        brand: "Philips", 
        model: "Goldway G30", 
        serial_number: "PH-98234-X", 
        location: "Sala de Emergencias A", 
        status: "activo", 
        created_at: new Date(Date.now() - 30*24*60*60*1000).toISOString()
      },
      { 
        id: "eq-2", 
        category_id: "cat-2", 
        name: "Autoclave de Mesa", 
        brand: "Tuttnauer", 
        model: "2540M", 
        serial_number: "TT-77341-M", 
        location: "Central de Esterilización", 
        status: "activo", 
        created_at: new Date(Date.now() - 60*24*60*60*1000).toISOString()
      },
      { 
        id: "eq-3", 
        category_id: "cat-3", 
        name: "Unidad Dental Completa", 
        brand: "Gnatus", 
        model: "G3 New", 
        serial_number: "GN-11029-D", 
        location: "Consultorio Odontológico 2", 
        status: "en_reparacion", 
        created_at: new Date(Date.now() - 15*24*60*60*1000).toISOString()
      }
    ]

    const defaultTemplates = [
      { id: "temp-1", category_id: "cat-1", name: "Mantenimiento Preventivo de Monitores", frequency: "mensual" },
      { id: "temp-2", category_id: "cat-2", name: "Checklist Semanal de Autoclaves", frequency: "semanal" }
    ]

    const defaultTemplateItems = [
      // Monitores
      { id: "item-1-1", template_id: "temp-1", label: "Inspección visual del cable de alimentación", item_type: "boolean", is_required: true, sort_order: 1 },
      { id: "item-1-2", template_id: "temp-1", label: "Prueba de encendido y calibración de alarmas", item_type: "boolean", is_required: true, sort_order: 2 },
      { id: "item-1-3", template_id: "temp-1", label: "Voltaje de batería interna (V)", item_type: "numero", is_required: true, sort_order: 3 },
      { id: "item-1-4", template_id: "temp-1", label: "Estado de sensores de SpO2 y NIBP", item_type: "seleccion", is_required: true, sort_order: 4 }, // we will select Buen Estado / Regular / Defectuoso
      { id: "item-1-5", template_id: "temp-1", label: "Notas y comentarios técnicos", item_type: "texto", is_required: false, sort_order: 5 },
      
      // Autoclaves
      { id: "item-2-1", template_id: "temp-2", label: "Nivel de agua destilada y limpieza de reservorio", item_type: "boolean", is_required: true, sort_order: 1 },
      { id: "item-2-2", template_id: "temp-2", label: "Verificar integridad del empaque de puerta", item_type: "boolean", is_required: true, sort_order: 2 },
      { id: "item-2-3", template_id: "temp-2", label: "Presión máxima alcanzada en ciclo (PSI)", item_type: "numero", is_required: true, sort_order: 3 }
    ]

    const defaultChecklists = [
      {
        id: "chk-1",
        equipment_id: "eq-1",
        template_id: "temp-1",
        technician_id: "usr-tech",
        scheduled_date: new Date().toISOString().split('T')[0],
        completed_at: null,
        status: "pendiente",
        general_notes: "",
        signature_url: "",
        created_at: new Date().toISOString()
      },
      {
        id: "chk-2",
        equipment_id: "eq-2",
        template_id: "temp-2",
        technician_id: "usr-tech",
        scheduled_date: new Date(Date.now() - 5*24*60*60*1000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
        status: "completado",
        general_notes: "Ciclo de esterilización completo verificado. Sin fugas detectadas.",
        signature_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        created_at: new Date(Date.now() - 7*24*60*60*1000).toISOString()
      }
    ]

    const defaultResponses = [
      { id: "resp-1", checklist_id: "chk-2", template_item_id: "item-2-1", value: "true", notes: "Llenado con agua destilada nueva" },
      { id: "resp-2", checklist_id: "chk-2", template_item_id: "item-2-2", value: "true", notes: "Sin grietas" },
      { id: "resp-3", checklist_id: "chk-2", template_item_id: "item-2-3", value: "32", notes: "Dentro del rango normal" }
    ]

    const defaultUsers = {
      "usr-admin": { id: "usr-admin", email: "admin@medicore.com", full_name: "Admin MediCore", role: "admin" },
      "usr-tech": { id: "usr-tech", email: "tecnico@medicore.com", full_name: "Técnico MediCore", role: "tecnico" }
    }

    const setIfEmpty = (key, val) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(val))
    }

    setIfEmpty("medicore_categories", defaultCategories)
    setIfEmpty("medicore_equipment", defaultEquipment)
    setIfEmpty("medicore_templates", defaultTemplates)
    setIfEmpty("medicore_template_items", defaultTemplateItems)
    setIfEmpty("medicore_checklists", defaultChecklists)
    setIfEmpty("medicore_responses", defaultResponses)
    setIfEmpty("medicore_users", defaultUsers)
  }

  initStorage()

  const getTableData = (table) => {
    return JSON.parse(localStorage.getItem(`medicore_${table}`)) || []
  }

  const setTableData = (table, data) => {
    localStorage.setItem(`medicore_${table}`, JSON.stringify(data))
  }

  // Helper to resolve relationships (simulating Supabase select joins)
  const resolveJoins = (table, data, selectQuery) => {
    if (!selectQuery || selectQuery === '*') return data

    // Simulating '*, category:equipment_categories(*)'
    if (table === 'equipment' && selectQuery.includes('category:equipment_categories')) {
      const categories = getTableData('categories')
      return data.map(item => ({
        ...item,
        category: categories.find(c => c.id === item.category_id) || null
      }))
    }

    // Simulating '*, category:equipment_categories(*)' in checklist_templates
    if (table === 'templates' && selectQuery.includes('category:equipment_categories')) {
      const categories = getTableData('categories')
      return data.map(item => ({
        ...item,
        category: categories.find(c => c.id === item.category_id) || null
      }))
    }

    // Simulating '*, equipment(*, category:equipment_categories(*)), template(*), technician:profiles(*)' in checklists
    if (table === 'checklists') {
      const equipment = resolveJoins('equipment', getTableData('equipment'), '*, category:equipment_categories(*)')
      const templates = getTableData('templates')
      const users = JSON.parse(localStorage.getItem('medicore_users')) || {}
      
      return data.map(item => ({
        ...item,
        equipment: equipment.find(e => e.id === item.equipment_id) || null,
        template: templates.find(t => t.id === item.template_id) || null,
        technician: Object.values(users).find(u => u.id === item.technician_id) || null
      }))
    }

    // Simulating '*, template_item:checklist_template_items(*)' in responses
    if (table === 'responses') {
      const items = getTableData('template_items')
      return data.map(item => ({
        ...item,
        template_item: items.find(i => i.id === item.template_item_id) || null
      }))
    }

    return data
  }

  // Subclass to mock query behavior
  class MockQueryBuilder {
    constructor(tableName) {
      // Map schema table names to storage keys
      const tableMap = {
        'profiles': 'users',
        'equipment_categories': 'categories',
        'equipment': 'equipment',
        'checklist_templates': 'templates',
        'checklist_template_items': 'template_items',
        'maintenance_checklists': 'checklists',
        'checklist_responses': 'responses'
      }
      this.table = tableMap[tableName] || tableName
      this.tableName = tableName
      this.filters = []
      this.orderField = null
      this.orderAsc = true
      this.selectQuery = '*'
      this.action = 'select'
      this.records = null
      this.updates = null
    }

    select(query = '*') {
      this.action = 'select'
      this.selectQuery = query
      return this
    }

    insert(records) {
      this.action = 'insert'
      this.records = records
      return this
    }

    upsert(records) {
      this.action = 'upsert'
      this.records = records
      return this
    }

    update(updates) {
      this.action = 'update'
      this.updates = updates
      return this
    }

    delete() {
      this.action = 'delete'
      return this
    }

    eq(field, value) {
      this.filters.push((item) => {
        // Handle join fields or straight comparison
        if (field === 'id') return item.id === value
        return item[field] === value
      })
      return this
    }

    match(obj) {
      this.filters.push((item) => {
        return Object.entries(obj).every(([key, value]) => item[key] === value)
      })
      return this
    }

    order(field, { ascending = true } = {}) {
      this.orderField = field
      this.orderAsc = ascending
      return this
    }

    gte(field, value) {
      this.filters.push((item) => item[field] >= value)
      return this
    }

    lte(field, value) {
      this.filters.push((item) => item[field] <= value)
      return this
    }

    async then(resolve) {
      try {
        if (this.action === 'insert') {
          const data = getTableData(this.table)
          const recordsArray = Array.isArray(this.records) ? this.records : [this.records]
          
          const inserted = recordsArray.map(r => ({
            id: r.id || `${this.table.slice(0, 3)}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            ...r
          }))

          setTableData(this.table, [...data, ...inserted])
          resolve({ data: Array.isArray(this.records) ? inserted : inserted[0], error: null })
          return
        }

        if (this.action === 'upsert') {
          const data = getTableData(this.table)
          const recordsArray = Array.isArray(this.records) ? this.records : [this.records]
          
          let updatedData = [...data]
          const insertedOrUpdated = []

          for (const r of recordsArray) {
            const id = r.id || `${this.table.slice(0, 3)}-${Math.random().toString(36).substr(2, 9)}`
            const existingIdx = updatedData.findIndex(item => item.id === id)
            
            const newRecord = {
              id,
              created_at: existingIdx >= 0 ? updatedData[existingIdx].created_at : new Date().toISOString(),
              ...r
            }

            if (existingIdx >= 0) {
              updatedData[existingIdx] = newRecord
            } else {
              updatedData.push(newRecord)
            }
            insertedOrUpdated.push(newRecord)
          }

          setTableData(this.table, updatedData)
          resolve({ data: Array.isArray(this.records) ? insertedOrUpdated : insertedOrUpdated[0], error: null })
          return
        }

        if (this.action === 'update') {
          let data = getTableData(this.table)
          let updatedItem = null

          // Apply filters to find which to update
          data = data.map(item => {
            let matches = true
            for (const filter of this.filters) {
              if (!filter(item)) matches = false
            }
            if (matches) {
              updatedItem = { ...item, ...this.updates }
              return updatedItem
            }
            return item
          })

          setTableData(this.table, data)
          resolve({ data: updatedItem, error: null })
          return
        }

        if (this.action === 'delete') {
          const data = getTableData(this.table)
          const remaining = data.filter(item => {
            let matches = true
            for (const filter of this.filters) {
              if (!filter(item)) matches = false
            }
            return !matches // keep items that don't match filters
          })

          setTableData(this.table, remaining)
          resolve({ data: null, error: null })
          return
        }

        // --- default 'select' action ---
        let data = getTableData(this.table)
        
        // For profiles table, we store it as a dict. Convert to array.
        if (this.table === 'users') {
          data = Object.values(data)
        }

        // Apply filters
        for (const filter of this.filters) {
          data = data.filter(filter)
        }

        // Apply ordering
        if (this.orderField) {
          data.sort((a, b) => {
            const valA = a[this.orderField]
            const valB = b[this.orderField]
            if (valA < valB) return this.orderAsc ? -1 : 1
            if (valA > valB) return this.orderAsc ? 1 : -1
            return 0
          })
        }

        // Resolve relation joins
        data = resolveJoins(this.table, data, this.selectQuery)

        resolve({ data, error: null })
      } catch (err) {
        resolve({ data: null, error: { message: err.message } })
      }
    }
  }

  // Setup mock auth triggers
  let authCallbacks = []

  supabaseClient = {
    from: (tableName) => new MockQueryBuilder(tableName),
    
    auth: {
      getSession: async () => {
        const currentUserId = localStorage.getItem("medicore_current_user_id")
        if (!currentUserId) return { data: { session: null }, error: null }

        const users = JSON.parse(localStorage.getItem("medicore_users")) || {}
        const user = users[currentUserId]

        if (!user) return { data: { session: null }, error: null }

        return { 
          data: { 
            session: {
              user: {
                id: user.id,
                email: user.email,
                user_metadata: {
                  full_name: user.full_name,
                  role: user.role
                }
              }
            } 
          }, 
          error: null 
        }
      },

      signInWithPassword: async ({ email, password }) => {
        const users = JSON.parse(localStorage.getItem("medicore_users")) || {}
        const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase())
        
        if (!user) {
          return { data: null, error: { message: "Invalid credentials (Demo Mode: use admin@medicore.com or tecnico@medicore.com)" } }
        }

        // In demo mode, accept any password or password 'admin123' / 'tecnico123'
        localStorage.setItem("medicore_current_user_id", user.id)
        
        const session = {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: {
              full_name: user.full_name,
              role: user.role
            }
          }
        }

        authCallbacks.forEach(cb => cb("SIGNED_IN", session))
        return { data: { session, user: session.user }, error: null }
      },

      signUp: async ({ email, password, options }) => {
        const users = JSON.parse(localStorage.getItem("medicore_users")) || {}
        const exists = Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase())

        if (exists) {
          return { data: null, error: { message: "User already exists" } }
        }

        const newId = `usr-${Math.random().toString(36).substr(2, 9)}`
        const full_name = options?.data?.full_name || "New User"
        const role = options?.data?.role || "tecnico"

        const newUser = { id: newId, email, full_name, role }
        users[newId] = newUser
        localStorage.setItem("medicore_users", JSON.stringify(users))
        localStorage.setItem("medicore_current_user_id", newId)

        const session = {
          user: {
            id: newId,
            email,
            user_metadata: { full_name, role }
          }
        }

        authCallbacks.forEach(cb => cb("SIGNED_IN", session))
        return { data: { session, user: session.user }, error: null }
      },

      signOut: async () => {
        localStorage.removeItem("medicore_current_user_id")
        authCallbacks.forEach(cb => cb("SIGNED_OUT", null))
        return { error: null }
      },

      onAuthStateChange: (callback) => {
        authCallbacks.push(callback)
        // Immediately fire with current status
        supabaseClient.auth.getSession().then(({ data }) => {
          callback(data.session ? "SIGNED_IN" : "SIGNED_OUT", data.session)
        })
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authCallbacks = authCallbacks.filter(cb => cb !== callback)
              }
            }
          }
        }
      }
    }
  }
}

export const supabase = supabaseClient
