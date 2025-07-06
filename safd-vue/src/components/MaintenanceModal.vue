<!-- src/components/MaintenanceModal.vue -->
<template>
  <BaseModal
    v-model="isOpen"
    title="Wartungsübersicht"
    icon="fas fa-wrench"
    size="large"
    :header-color="'var(--accent-orange)'"
  >
    <!-- Header Stats -->
    <div class="maintenance-header">
      <div class="stat-card urgent">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ overdueMaintenance.length }}</div>
          <div class="stat-label">Überfällig</div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ dueSoonMaintenance.length }}</div>
          <div class="stat-label">Fällig (30 Tage)</div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ upToDateMaintenance.length }}</div>
          <div class="stat-label">Aktuell</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="maintenance-filters">
      <div class="filter-group">
        <select v-model="selectedFilter" class="filter-select">
          <option value="all">Alle anzeigen</option>
          <option value="overdue">Nur überfällige</option>
          <option value="due-soon">Fällig in 30 Tagen</option>
          <option value="up-to-date">Aktuelle Wartung</option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="selectedDistrict" class="filter-select">
          <option value="">Alle Gebiete</option>
          <option v-for="district in districts" :key="district" :value="district">
            {{ district }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Hydrant-ID oder Gebiet..."
          class="filter-input"
        />
      </div>
    </div>

    <!-- Maintenance List -->
    <div class="maintenance-list">
      <div
        v-for="hydrant in filteredHydrants"
        :key="hydrant.id"
        class="maintenance-item"
        :class="getMaintenanceClass(hydrant)"
      >
        <div class="hydrant-info">
          <div class="hydrant-header">
            <h4>Hydrant #{{ hydrant.id }}</h4>
            <span class="status-badge" :class="getStatusClass(hydrant)">
              {{ getMaintenanceStatus(hydrant) }}
            </span>
          </div>

          <div class="hydrant-details">
            <div class="detail-row">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ hydrant.area || 'Kein Gebiet' }}</span>
            </div>
            <div class="detail-row">
              <i class="fas fa-fire-hydrant"></i>
              <span>{{ hydrant.type || 'Unbekannt' }}</span>
            </div>
            <div class="detail-row">
              <i class="fas fa-calendar-alt"></i>
              <span>Letzte Wartung: {{ formatDate(hydrant.lastService) }}</span>
            </div>
            <div class="detail-row">
              <i class="fas fa-calendar-check"></i>
              <span>Nächste Wartung: {{ formatDate(hydrant.nextService) }}</span>
            </div>
            <div v-if="hydrant.notes" class="detail-row">
              <i class="fas fa-sticky-note"></i>
              <span>{{ hydrant.notes }}</span>
            </div>
          </div>
        </div>

        <div class="maintenance-actions">
          <button
            @click="markAsServiced(hydrant)"
            class="action-btn service-btn"
            :disabled="!userStore.isAdmin"
            title="Als gewartet markieren"
          >
            <i class="fas fa-check"></i>
            Gewartet
          </button>

          <button
            @click="scheduleService(hydrant)"
            class="action-btn schedule-btn"
            :disabled="!userStore.isAdmin"
            title="Wartung planen"
          >
            <i class="fas fa-calendar-plus"></i>
            Planen
          </button>

          <button
            @click="editHydrant(hydrant)"
            class="action-btn edit-btn"
            title="Details bearbeiten"
          >
            <i class="fas fa-edit"></i>
            Bearbeiten
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredHydrants.length === 0" class="empty-state">
        <i class="fas fa-clipboard-check"></i>
        <h3>Keine Hydranten gefunden</h3>
        <p>Mit den aktuellen Filtern wurden keine Hydranten gefunden.</p>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <button @click="exportMaintenanceReport" class="btn btn-secondary">
        <i class="fas fa-download"></i>
        Bericht exportieren
      </button>

      <button @click="scheduleAllOverdue" class="btn btn-warning" :disabled="!userStore.isAdmin">
        <i class="fas fa-calendar-plus"></i>
        Alle überfälligen planen
      </button>

      <button @click="close" class="btn btn-primary">
        <i class="fas fa-times"></i>
        Schließen
      </button>
    </template>
  </BaseModal>

  <!-- Service Date Modal -->
  <BaseModal
    v-model="showServiceModal"
    title="Wartung durchgeführt"
    icon="fas fa-wrench"
    size="medium"
  >
    <div class="service-form">
      <h4>Hydrant #{{ selectedHydrant?.id }}</h4>
      <p class="service-description">Bitte geben Sie das Datum der durchgeführten Wartung ein:</p>

      <div class="form-group">
        <label>Wartungsdatum</label>
        <input v-model="serviceDate" type="date" class="form-input" :max="today" />
      </div>

      <div class="form-group">
        <label>Nächste Wartung (empfohlen: 1 Jahr)</label>
        <input v-model="nextServiceDate" type="date" class="form-input" :min="today" />
      </div>

      <div class="form-group">
        <label>Wartungsnotizen (optional)</label>
        <textarea
          v-model="serviceNotes"
          class="form-textarea"
          placeholder="Durchgeführte Arbeiten, Besonderheiten..."
          rows="3"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button @click="cancelService" class="btn btn-secondary">
        <i class="fas fa-times"></i>
        Abbrechen
      </button>
      <button @click="confirmService" class="btn btn-success">
        <i class="fas fa-check"></i>
        Wartung bestätigen
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useHydrantsStore } from '@/stores/hydrants'
import { useUserStore } from '@/stores/user'
import BaseModal from './BaseModal.vue'

// 🎭 Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'edit-hydrant'])

// 🏪 Stores
const hydrantsStore = useHydrantsStore()
const userStore = useUserStore()

// 📊 Reactive State
const isOpen = ref(false)
const selectedFilter = ref('all')
const selectedDistrict = ref('')
const searchQuery = ref('')

// Service Modal
const showServiceModal = ref(false)
const selectedHydrant = ref(null)
const serviceDate = ref('')
const nextServiceDate = ref('')
const serviceNotes = ref('')

// 🧮 Computed Properties
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Calculate maintenance categories
const overdueMaintenance = computed(() => {
  const today = new Date()
  return hydrantsStore.hydrants.filter((h) => {
    if (!h.nextService) return true // No service date = overdue
    return new Date(h.nextService) < today
  })
})

const dueSoonMaintenance = computed(() => {
  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  return hydrantsStore.hydrants.filter((h) => {
    if (!h.nextService) return false
    const nextService = new Date(h.nextService)
    return nextService >= today && nextService <= thirtyDaysFromNow
  })
})

const upToDateMaintenance = computed(() => {
  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  return hydrantsStore.hydrants.filter((h) => {
    if (!h.nextService) return false
    return new Date(h.nextService) > thirtyDaysFromNow
  })
})

const districts = computed(() => {
  const allDistricts = hydrantsStore.hydrants.map((h) => h.area).filter(Boolean)
  return [...new Set(allDistricts)].sort()
})

const filteredHydrants = computed(() => {
  let hydrants = hydrantsStore.hydrants

  // Filter by maintenance status
  switch (selectedFilter.value) {
    case 'overdue':
      hydrants = overdueMaintenance.value
      break
    case 'due-soon':
      hydrants = dueSoonMaintenance.value
      break
    case 'up-to-date':
      hydrants = upToDateMaintenance.value
      break
  }

  // Filter by district
  if (selectedDistrict.value) {
    hydrants = hydrants.filter((h) => h.area === selectedDistrict.value)
  }

  // Filter by search
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    hydrants = hydrants.filter(
      (h) => h.id.toString().includes(search) || h.area?.toLowerCase().includes(search),
    )
  }

  // Sort by urgency (overdue first)
  return hydrants.sort((a, b) => {
    const aOverdue = overdueMaintenance.value.includes(a)
    const bOverdue = overdueMaintenance.value.includes(b)

    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // If both same urgency, sort by next service date
    if (!a.nextService && !b.nextService) return 0
    if (!a.nextService) return -1
    if (!b.nextService) return 1

    return new Date(a.nextService) - new Date(b.nextService)
  })
})

// 👀 Watchers
watch(
  () => props.modelValue,
  (value) => {
    isOpen.value = value
  },
)

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

// 🎮 Methods
const close = () => {
  isOpen.value = false
}

const getMaintenanceClass = (hydrant) => {
  if (overdueMaintenance.value.includes(hydrant)) return 'overdue'
  if (dueSoonMaintenance.value.includes(hydrant)) return 'due-soon'
  return 'up-to-date'
}

const getStatusClass = (hydrant) => {
  if (overdueMaintenance.value.includes(hydrant)) return 'status-urgent'
  if (dueSoonMaintenance.value.includes(hydrant)) return 'status-warning'
  return 'status-success'
}

const getMaintenanceStatus = (hydrant) => {
  if (overdueMaintenance.value.includes(hydrant)) return 'Überfällig'
  if (dueSoonMaintenance.value.includes(hydrant)) return 'Fällig'
  return 'Aktuell'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Nicht angegeben'

  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const markAsServiced = (hydrant) => {
  selectedHydrant.value = hydrant
  serviceDate.value = today.value

  // Calculate next service date (1 year from now)
  const nextYear = new Date()
  nextYear.setFullYear(nextYear.getFullYear() + 1)
  nextServiceDate.value = nextYear.toISOString().split('T')[0]

  serviceNotes.value = ''
  showServiceModal.value = true
}

const scheduleService = (hydrant) => {
  selectedHydrant.value = hydrant
  serviceDate.value = hydrant.lastService || ''
  nextServiceDate.value = hydrant.nextService || ''
  serviceNotes.value = hydrant.notes || ''
  showServiceModal.value = true
}

const editHydrant = (hydrant) => {
  emit('edit-hydrant', hydrant)
  close()
}

const confirmService = () => {
  if (!selectedHydrant.value || !serviceDate.value || !nextServiceDate.value) {
    window.showToast?.('Bitte füllen Sie alle Pflichtfelder aus', 'warning')
    return
  }

  const updatedHydrant = {
    ...selectedHydrant.value,
    lastService: serviceDate.value,
    nextService: nextServiceDate.value,
    notes: serviceNotes.value,
    status: 'ok', // Reset status to OK after service
  }

  hydrantsStore.updateHydrant(selectedHydrant.value.id, updatedHydrant)

  window.showToast?.(
    `Wartung für Hydrant #${selectedHydrant.value.id} wurde aktualisiert`,
    'success',
  )

  cancelService()
}

const cancelService = () => {
  showServiceModal.value = false
  selectedHydrant.value = null
  serviceDate.value = ''
  nextServiceDate.value = ''
  serviceNotes.value = ''
}

const scheduleAllOverdue = async () => {
  if (!userStore.isAdmin) return

  const confirmed = await window.showConfirm?.(
    `Möchten Sie für alle ${overdueMaintenance.value.length} überfälligen Hydranten die nächste Wartung auf nächstes Jahr planen?`,
    'Alle überfälligen Hydranten planen',
  )

  if (confirmed) {
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    const nextServiceDate = nextYear.toISOString().split('T')[0]

    overdueMaintenance.value.forEach((hydrant) => {
      hydrantsStore.updateHydrant(hydrant.id, {
        ...hydrant,
        nextService: nextServiceDate,
      })
    })

    window.showToast?.(`${overdueMaintenance.value.length} Hydranten geplant`, 'success')
  }
}

const exportMaintenanceReport = () => {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: hydrantsStore.hydrants.length,
      overdue: overdueMaintenance.value.length,
      dueSoon: dueSoonMaintenance.value.length,
      upToDate: upToDateMaintenance.value.length,
    },
    hydrants: filteredHydrants.value.map((h) => ({
      id: h.id,
      area: h.area,
      type: h.type,
      status: h.status,
      lastService: h.lastService,
      nextService: h.nextService,
      maintenanceStatus: getMaintenanceStatus(h),
      notes: h.notes,
    })),
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `Wartungsbericht_${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(url)
  window.showToast?.('Wartungsbericht exportiert', 'success')
}
</script>

<style scoped>
/* Header Stats */
.maintenance-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  gap: 12px;
}

.stat-card.urgent {
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid var(--danger);
}

.stat-card.warning {
  background: rgba(255, 165, 2, 0.1);
  border: 1px solid var(--warning);
}

.stat-card.success {
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid var(--success);
}

.stat-icon {
  font-size: 24px;
}

.urgent .stat-icon {
  color: var(--danger);
}

.warning .stat-icon {
  color: var(--warning);
}

.success .stat-icon {
  color: var(--success);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Filters */
.maintenance-filters {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-select,
.filter-input {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
}

/* Maintenance List */
.maintenance-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.maintenance-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.2s ease;
}

.maintenance-item.overdue {
  background: rgba(255, 71, 87, 0.05);
  border-left-color: var(--danger);
}

.maintenance-item.due-soon {
  background: rgba(255, 165, 2, 0.05);
  border-left-color: var(--warning);
}

.maintenance-item.up-to-date {
  background: rgba(46, 213, 115, 0.05);
  border-left-color: var(--success);
}

.hydrant-info {
  flex: 1;
}

.hydrant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hydrant-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-urgent {
  background: var(--danger);
  color: white;
}

.status-warning {
  background: var(--warning);
  color: white;
}

.status-success {
  background: var(--success);
  color: white;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-row i {
  width: 16px;
  color: var(--text-secondary);
}

/* Actions */
.maintenance-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 16px;
}

.action-btn {
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.service-btn {
  border-color: var(--success);
  color: var(--success);
}

.service-btn:hover {
  background: var(--success);
  color: white;
}

.schedule-btn {
  border-color: var(--warning);
  color: var(--warning);
}

.schedule-btn:hover {
  background: var(--warning);
  color: white;
}

.edit-btn {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.edit-btn:hover {
  background: var(--accent-blue);
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin-bottom: 8px;
  color: var(--text-primary);
}

/* Service Form */
.service-form h4 {
  margin-bottom: 8px;
  color: var(--text-primary);
}

.service-description {
  margin-bottom: 20px;
  color: var(--text-secondary);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Footer Buttons */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary {
  background: var(--surface-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-warning {
  background: var(--warning);
  color: white;
}

.btn-success {
  background: var(--success);
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .maintenance-header {
    grid-template-columns: 1fr;
  }

  .maintenance-filters {
    grid-template-columns: 1fr;
  }

  .maintenance-item {
    flex-direction: column;
    gap: 12px;
  }

  .maintenance-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
