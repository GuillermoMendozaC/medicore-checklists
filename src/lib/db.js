import Dexie from 'dexie'

// Initialize IndexedDB database for offline support
export const db = new Dexie('MediCoreOfflineDB')

// Define tables and indexes
// Primary keys are the first field, other fields are indexed for queries
db.version(1).stores({
  equipment: 'id, category_id, name, status',
  checklist_templates: 'id, category_id, name',
  checklist_template_items: 'id, template_id, label',
  pending_checklists: 'id, equipment_id, template_id, technician_id, status, scheduled_date',
  pending_responses: 'id, checklist_id, template_item_id'
})
