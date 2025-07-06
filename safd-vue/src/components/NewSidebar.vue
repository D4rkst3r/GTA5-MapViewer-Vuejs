<!-- src/components/Sidebar.vue - MIT ZEICHENTOOLS -->
<template>
  <div class="sidebar" :class="{ open: isOpen }">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="sidebar-title">
        <i class="fas fa-fire-flame-curved"></i>
        SAFD Command Center
      </div>
      <div class="sidebar-subtitle">Hydranten Management System</div>
    </div>

    <!-- Content -->
    <div class="sidebar-content">
      <!-- Map Properties Section -->
      <SidebarSection title="Karteneigenschaften" icon="fas fa-map" :expanded="true">
        <div class="control-group">
          <label class="control-label">Kartentyp</label>
          <select v-model="mapStore.mapStyle" class="modern-select" @change="onMapStyleChange">
            <option value="road">Straßenkarte</option>
            <option value="satellite">Satellit</option>
            <option value="atlas">Atlas</option>
          </select>
        </div>

        <div class="control-group">
          <label class="control-label">Gebiet Filter</label>
          <select v-model="hydrantsStore.filters.district" class="modern-select">
            <option value="">– Alle Gebiete –</option>
            <option v-for="district in districts" :key="district" :value="district">
              {{ district }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label class="control-label">Hydranten-Suche</label>
          <div class="search-wrapper">
            <input
              v-model="hydrantsStore.filters.search"
              type="search"
              class="modern-input"
              placeholder="ID, Gebiet, Status..."
            />
            <button
              v-if="hydrantsStore.filters.search"
              @click="hydrantsStore.filters.search = ''"
              class="search-clear"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </SidebarSection>

      <!-- Hydranten Management -->
      <SidebarSection title="Hydranten verwalten" icon="fas fa-fire-hydrant" :expanded="true">
        <div class="stats-overview">
          <div class="stat-item">
            <span class="stat-value">{{ hydrantsStore.hydrants.length }}</span>
            <span class="stat-label">Gesamt</span>
          </div>
          <div class="stat-item" :class="{ 'stat-urgent': hydrantStats.maintenance > 0 }">
            <span class="stat-value">{{ hydrantStats.maintenance }}</span>
            <span class="stat-label">Wartung fällig</span>
          </div>
        </div>

        <button v-if="userStore.isAdmin" @click="startAddingHydrant()" class="modern-button">
          <i class="fas fa-plus"></i>
          Neuen Hydranten hinzufügen
        </button>

        <button @click="showMaintenanceModal" class="modern-button button-secondary">
          <i class="fas fa-wrench"></i>
          Wartungsübersicht
          <span v-if="hydrantStats.maintenance > 0" class="urgent-badge">
            {{ hydrantStats.maintenance }}
          </span>
        </button>

        <!-- Hydrantenliste -->
        <div class="hydrant-list-section">
          <div class="section-header" @click="toggleHydrantList">
            <h4>Hydranten Liste</h4>
            <button class="toggle-btn">
              <i :class="showHydrantList ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            </button>
          </div>

          <div v-if="showHydrantList" class="hydrant-list">
            <div
              v-for="hydrant in filteredHydrants"
              :key="hydrant.id"
              class="hydrant-item"
              :class="{ 'maintenance-due': isMaintenanceDue(hydrant) }"
            >
              <div class="hydrant-info">
                <div class="hydrant-title">
                  <i
                    class="fas fa-fire-hydrant"
                    :style="{ color: getStatusColor(hydrant.status) }"
                  ></i>
                  Hydrant #{{ hydrant.id }}
                  <span v-if="isMaintenanceDue(hydrant)" class="maintenance-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                  </span>
                </div>
                <div class="hydrant-details">
                  {{ hydrant.area }} • {{ hydrant.type }} • {{ hydrant.status }}
                </div>
              </div>
              <div class="hydrant-actions">
                <button
                  @click="openHydrantForm(hydrant)"
                  class="action-btn edit-btn"
                  title="Bearbeiten"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  v-if="userStore.isAdmin"
                  @click="deleteHydrant(hydrant.id)"
                  class="action-btn delete-btn"
                  title="Löschen"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarSection>

      <!-- POI Management -->
      <SidebarSection title="Orte von Interesse" icon="fas fa-landmark">
        <div class="poi-toggles">
          <ToggleSwitch
            v-model="mapStore.layers.gas_station"
            icon="fas fa-gas-pump"
            label="Tankstellen"
          />
          <ToggleSwitch v-model="mapStore.layers.windmill" icon="fas fa-wind" label="Windmühlen" />
          <ToggleSwitch
            v-model="mapStore.layers.power_plant"
            icon="fas fa-bolt"
            label="Umspannwerke"
          />
          <ToggleSwitch
            v-model="mapStore.layers.oil_pump"
            icon="fas fa-oil-well"
            label="Ölpumpen"
          />
          <ToggleSwitch v-model="mapStore.layers.tanks" icon="fas fa-database" label="Tanks" />
        </div>

        <button
          v-if="userStore.isAdmin"
          @click="startAddingPOI()"
          class="modern-button button-secondary"
        >
          <i class="fas fa-plus"></i>
          Neuen POI hinzufügen
        </button>
      </SidebarSection>

      <!-- Layer Management -->
      <SidebarSection title="Layer verwalten" icon="fas fa-layer-group">
        <ToggleSwitch
          v-model="mapStore.layers.hydrants"
          icon="fas fa-fire-hydrant"
          label="Hydranten"
        />
        <ToggleSwitch
          v-model="mapStore.layers.districts"
          icon="fas fa-map-pin"
          label="Bezirksnamen"
        />
        <ToggleSwitch v-model="mapStore.layers.routes" icon="fas fa-route" label="Anfahrtswege" />
        <ToggleSwitch
          v-model="mapStore.layers.exclusions"
          icon="fas fa-ban"
          label="Ausschlussgebiete"
        />
        <ToggleSwitch
          v-model="mapStore.layers.drawings"
          icon="fas fa-draw-polygon"
          label="Zeichnungen"
        />
      </SidebarSection>

      <!-- ✅ NEUE ZEICHENTOOLS SEKTION -->
      <SidebarSection title="Zeichentools" icon="fas fa-pen" :expanded="false">
        <!-- Drawing Status -->
        <div class="drawing-status" :class="drawingStatusClass">
          <div class="status-indicator">
            <i :class="drawingStatusIcon"></i>
            <div class="status-info">
              <span class="status-text">{{ drawingStatusText }}</span>
              <span class="status-mode">{{ currentDrawingMode }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Mode Buttons -->
        <div class="quick-modes">
          <button
            v-for="mode in quickModes"
            :key="mode.value"
            @click="setQuickDrawingMode(mode.value)"
            class="quick-mode-btn"
            :class="{ active: drawingMode === mode.value }"
            :title="mode.tooltip"
          >
            <i :class="mode.icon"></i>
          </button>
        </div>

        <!-- Drawing Controls -->
        <div class="drawing-controls">
          <button @click="openDrawingControls" class="modern-button button-purple">
            <i class="fas fa-palette"></i>
            Erweiterte Einstellungen
          </button>

          <div class="drawing-stats">
            <div class="stat-row">
              <span>Zeichnungen:</span>
              <span class="stat-value">{{ drawingsCount }}</span>
            </div>
          </div>

          <div class="drawing-actions">
            <button @click="clearAllDrawings" class="modern-button button-warning">
              <i class="fas fa-trash"></i>
              Alle löschen
            </button>

            <button @click="exportDrawings" class="modern-button button-secondary">
              <i class="fas fa-download"></i>
              Exportieren
            </button>
          </div>
        </div>
      </SidebarSection>

      <!-- Admin Login -->
      <div class="admin-section">
        <button
          class="modern-button"
          :class="userStore.isAdmin ? 'button-warning' : ''"
          @click="userStore.toggleAdmin()"
        >
          <i :class="userStore.isAdmin ? 'fas fa-unlock' : 'fas fa-key'"></i>
          {{ userStore.isAdmin ? 'Admin Logout' : 'Admin Login' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <HydrantForm
    v-model="showHydrantForm"
    :hydrant="modalData.hydrant"
    @hydrant-saved="onHydrantSaved"
  />

  <POIForm v-model="showPOIForm" :poi="modalData.poi" @poi-saved="onPOISaved" />

  <MaintenanceModal v-model="showMaintenanceOverview" @edit-hydrant="onMaintenanceEditHydrant" />

  <!-- ✅ NEUE ZEICHENTOOLS MODAL -->
  <DrawingControls
    v-model="showDrawingControls"
    @mode-changed="onDrawingModeChanged"
    @styles-changed="onDrawingStylesChanged"
    @clear-drawings="onClearDrawings"
    @export-drawings="onExportDrawings"
    @import-drawings="onImportDrawings"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMapStore } from '@/stores/map'
import { useHydrantsStore } from '@/stores/hydrants'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { usePOIStore } from '@/stores/pois'

// Components
import SidebarSection from './SidebarSection.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import HydrantForm from './HydrantForm.vue'
import POIForm from './POIForm.vue'
import MaintenanceModal from './MaintenanceModal.vue'
import DrawingControls from './DrawingControls.vue' // ✅ NEU

// 🎭 Props
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

// 🏪 Stores
const mapStore = useMapStore()
const hydrantsStore = useHydrantsStore()
const userStore = useUserStore()
const poiStore = usePOIStore()
const uiStore = useUIStore()

// 🎭 Modal State
const modalData = ref({
  hydrant: null,
  poi: null,
})
const showHydrantForm = ref(false)
const showPOIForm = ref(false)
const showMaintenanceOverview = ref(false)
const showDrawingControls = ref(false) // ✅ NEU

// 📊 Reactive Data
const drawingMode = ref('simple_select') // ✅ NEU: Zeichenmodus
const showHydrantList = ref(false)

// ✅ ZEICHENTOOLS KONFIGURATION
const quickModes = [
  {
    value: 'simple_select',
    icon: 'fas fa-mouse-pointer',
    tooltip: 'Auswählen & Bearbeiten',
  },
  {
    value: 'draw_point',
    icon: 'fas fa-map-pin',
    tooltip: 'Punkt zeichnen',
  },
  {
    value: 'draw_line_string',
    icon: 'fas fa-minus',
    tooltip: 'Linie zeichnen',
  },
  {
    value: 'draw_polygon',
    icon: 'fas fa-draw-polygon',
    tooltip: 'Polygon zeichnen',
  },
]

// 🧮 Computed Properties
const districts = computed(() => {
  const allDistricts = hydrantsStore.hydrants.map((h) => h.area).filter(Boolean)
  return [...new Set(allDistricts)].sort()
})

const filteredHydrants = computed(() => {
  let hydrants = hydrantsStore.hydrants

  if (hydrantsStore.filters.district) {
    hydrants = hydrants.filter((h) => h.area === hydrantsStore.filters.district)
  }

  if (hydrantsStore.filters.search) {
    const search = hydrantsStore.filters.search.toLowerCase()
    hydrants = hydrants.filter(
      (h) =>
        h.id.toString().includes(search) ||
        h.area?.toLowerCase().includes(search) ||
        h.status?.toLowerCase().includes(search),
    )
  }

  return hydrants.slice(0, 10)
})

const hydrantStats = computed(() => {
  const today = new Date()
  const maintenanceDue = hydrantsStore.hydrants.filter((h) => {
    if (!h.nextService) return true
    return new Date(h.nextService) < today
  }).length

  return {
    maintenance: maintenanceDue,
  }
})

// ✅ ZEICHENTOOLS COMPUTED
const drawingsCount = computed(() => {
  return mapStore.drawings?.features?.length || 0
})

const drawingStatusClass = computed(() => {
  switch (drawingMode.value) {
    case 'simple_select':
      return 'status-select'
    case 'draw_point':
      return 'status-point'
    case 'draw_line_string':
      return 'status-line'
    case 'draw_polygon':
      return 'status-polygon'
    default:
      return 'status-default'
  }
})

const drawingStatusIcon = computed(() => {
  switch (drawingMode.value) {
    case 'simple_select':
      return 'fas fa-mouse-pointer'
    case 'draw_point':
      return 'fas fa-map-pin'
    case 'draw_line_string':
      return 'fas fa-minus'
    case 'draw_polygon':
      return 'fas fa-draw-polygon'
    default:
      return 'fas fa-draw-polygon'
  }
})

const drawingStatusText = computed(() => {
  switch (drawingMode.value) {
    case 'simple_select':
      return 'Bereit'
    case 'draw_point':
      return 'Punkt Modus'
    case 'draw_line_string':
      return 'Linien Modus'
    case 'draw_polygon':
      return 'Polygon Modus'
    default:
      return 'Bereit'
  }
})

const currentDrawingMode = computed(() => {
  const mode = quickModes.find((m) => m.value === drawingMode.value)
  return mode ? mode.tooltip : 'Unbekannt'
})

// 🎮 Methods
const onMapStyleChange = () => {
  mapStore.setMapStyle(mapStore.mapStyle)
}

const showMaintenanceModal = () => {
  showMaintenanceOverview.value = true
}

const toggleHydrantList = () => {
  showHydrantList.value = !showHydrantList.value
}

const startAddingHydrant = () => {
  if (!userStore.isAdmin) {
    showToast('Nur Admins können Hydranten hinzufügen', 'error')
    return
  }

  uiStore.pendingHydrantData = {
    area: '',
    type: 'unterflur',
    status: 'ok',
    lastService: '',
    nextService: '',
  }

  uiStore.isAddingHydrant = true
  showToast('Klicke auf die Karte, um einen neuen Hydranten zu platzieren', 'info')
}

const openHydrantForm = (hydrant = null) => {
  modalData.value.hydrant = hydrant
  showHydrantForm.value = true
}

const onMaintenanceEditHydrant = (hydrant) => {
  openHydrantForm(hydrant)
}

const deleteHydrant = async (hydrantId) => {
  const confirmed = await showConfirm(`Hydrant #${hydrantId} wirklich löschen?`, 'Hydrant löschen')

  if (confirmed) {
    hydrantsStore.deleteHydrant(hydrantId)
    showToast(`Hydrant #${hydrantId} gelöscht`, 'success')
  }
}

const isMaintenanceDue = (hydrant) => {
  if (!hydrant.nextService) return true
  return new Date(hydrant.nextService) < new Date()
}

const getStatusColor = (status) => {
  switch (status) {
    case 'ok':
      return '#2ed573'
    case 'wartung':
      return '#ffa502'
    case 'defekt':
      return '#ff4757'
    default:
      return '#cccccc'
  }
}

const startAddingPOI = () => {
  if (!userStore.isAdmin) {
    showToast('Nur Admins können POIs hinzufügen', 'error')
    return
  }
  openPOIForm()
}

const openPOIForm = (poi = null) => {
  modalData.value.poi = poi
  showPOIForm.value = true
}

const onHydrantSaved = (hydrantData) => {
  if (hydrantData.isNew) {
    uiStore.pendingHydrantData = hydrantData
    uiStore.isAddingHydrant = true
    showToast('Klicke auf die Karte, um den Hydranten zu platzieren', 'info')
  } else {
    hydrantsStore.updateHydrant(hydrantData)
    showToast('Hydrant aktualisiert', 'success')
  }

  showHydrantForm.value = false
}

const onPOISaved = (poiData) => {
  if (poiData.isEditing) {
    poiStore.updatePOI(poiData.id, poiData)
  } else {
    uiStore.pendingPOIData = poiData
    uiStore.isAddingPOI = true
    showToast('Klicke auf die Karte, um den POI zu platzieren', 'info')
  }

  showPOIForm.value = false
}

// ✅ ZEICHENTOOLS METHODS
const openDrawingControls = () => {
  showDrawingControls.value = true
}

const setQuickDrawingMode = (mode) => {
  drawingMode.value = mode
  // Emit event für MapContainer
  emitDrawingModeChange(mode)
  console.log(`🎨 Schneller Zeichenmodus: ${mode}`)
}

const onDrawingModeChanged = (mode) => {
  drawingMode.value = mode
  emitDrawingModeChange(mode)
}

const onDrawingStylesChanged = (styles) => {
  // Emit styles to MapContainer
  emitDrawingStylesChange(styles)
  console.log('🎨 Zeichenstile geändert:', styles)
}

const onClearDrawings = () => {
  mapStore.drawings.features = []
  mapStore.saveDrawings()
  emitClearDrawings()
}

const onExportDrawings = (drawings) => {
  // Export logic already handled in DrawingControls
  console.log('📥 Zeichnungen exportiert')
}

const onImportDrawings = (drawings) => {
  if (drawings.features) {
    mapStore.drawings = drawings
    mapStore.saveDrawings()
    emitImportDrawings(drawings)
  }
}

const clearAllDrawings = async () => {
  const confirmed = await showConfirm('Alle Zeichnungen wirklich löschen?', 'Zeichnungen löschen')

  if (confirmed) {
    onClearDrawings()
    showToast('Alle Zeichnungen gelöscht', 'success')
  }
}

const exportDrawings = () => {
  const data = JSON.stringify(mapStore.drawings, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `SAFD_Zeichnungen_${new Date().toISOString().split('T')[0]}.geojson`
  link.click()

  URL.revokeObjectURL(url)
  showToast('Zeichnungen exportiert', 'success')
}

// ✅ PROVIDE DRAWING EVENTS für MapContainer
const emitDrawingModeChange = (mode) => {
  // Event für MapContainer
  window.dispatchEvent(
    new CustomEvent('drawing-mode-changed', {
      detail: { mode },
    }),
  )
}

const emitDrawingStylesChange = (styles) => {
  window.dispatchEvent(
    new CustomEvent('drawing-styles-changed', {
      detail: { styles },
    }),
  )
}

const emitClearDrawings = () => {
  window.dispatchEvent(new CustomEvent('clear-drawings'))
}

const emitImportDrawings = (drawings) => {
  window.dispatchEvent(
    new CustomEvent('import-drawings', {
      detail: { drawings },
    }),
  )
}

// 🔧 Utility Functions
const showConfirm = async (message, title = 'Bestätigung') => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n\n${message}`)
    resolve(confirmed)
  })
}

const showToast = (message, type = 'info', duration = 3000) => {
  if (window.showToast) {
    window.showToast(message, type, duration)
  } else {
    console.log(`🍞 Toast [${type}]: ${message}`)
  }
}

// 🎬 Lifecycle
onMounted(() => {
  console.log('🎛️ Sidebar mit Zeichentools geladen')
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: -400px;
  width: 380px;
  height: 100vh;
  background: var(--surface);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-color);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

.sidebar.open {
  left: 0;
}

.sidebar-header {
  padding: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 5px;
}

.sidebar-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.sidebar-content {
  padding: 0;
}

.admin-section {
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.control-group {
  margin-bottom: 20px;
}

.control-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.modern-select,
.modern-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}

.modern-select:focus,
.modern-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1);
}

.modern-button {
  width: 100%;
  padding: 12px 16px;
  background: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.modern-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
}

.button-secondary {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
}

.button-secondary:hover {
  background: #3167c7;
  box-shadow: 0 4px 12px rgba(66, 135, 245, 0.3);
}

.button-warning {
  background: var(--warning);
  border-color: var(--warning);
}

.button-warning:hover {
  background: #e55a00;
  box-shadow: 0 4px 12px rgba(255, 165, 2, 0.3);
}

/* ✅ NEUER LILA BUTTON für Zeichentools */
.button-purple {
  background: var(--accent-purple);
  border-color: var(--accent-purple);
}

.button-purple:hover {
  background: #8b3cbf;
  box-shadow: 0 4px 12px rgba(157, 77, 221, 0.3);
}

.urgent-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--danger);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.search-wrapper {
  position: relative;
}

.search-clear {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 40px;
  height: 100%;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.search-clear:hover {
  opacity: 1;
  color: var(--primary-color);
}

.stats-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;
}

.stat-item.stat-urgent {
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid var(--danger);
}

.stat-item.stat-urgent .stat-value {
  color: var(--danger);
  animation: pulse 1.5s infinite;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.poi-toggles {
  margin-bottom: 16px;
}

/* ===== HYDRANTENLISTE STYLES ===== */
.hydrant-list-section {
  margin: 16px 0;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.hydrant-list {
  max-height: 300px;
  overflow-y: auto;
}

.hydrant-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s ease;
}

.hydrant-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.hydrant-item.maintenance-due {
  border-left: 3px solid var(--warning);
  background: rgba(255, 165, 2, 0.05);
}

.hydrant-info {
  flex: 1;
}

.hydrant-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.maintenance-warning {
  color: var(--warning);
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.3;
  }
}

.hydrant-details {
  font-size: 12px;
  color: var(--text-secondary);
}

.hydrant-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.edit-btn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.delete-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: rgba(255, 71, 87, 0.1);
}

/* ===== ✅ ZEICHENTOOLS STYLES ===== */
.drawing-status {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.status-select {
  background: rgba(66, 135, 245, 0.1);
  border-color: var(--accent-blue);
}

.status-point {
  background: rgba(46, 213, 115, 0.1);
  border-color: var(--success);
}

.status-line {
  background: rgba(255, 165, 2, 0.1);
  border-color: var(--warning);
}

.status-polygon {
  background: rgba(157, 77, 221, 0.1);
  border-color: var(--accent-purple);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator i {
  font-size: 20px;
  color: var(--accent-blue);
}

.status-select .status-indicator i {
  color: var(--accent-blue);
}
.status-point .status-indicator i {
  color: var(--success);
}
.status-line .status-indicator i {
  color: var(--warning);
}
.status-polygon .status-indicator i {
  color: var(--accent-purple);
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.status-mode {
  font-size: 11px;
  color: var(--text-secondary);
}

.quick-modes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}

.quick-mode-btn {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.quick-mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.quick-mode-btn.active {
  background: rgba(157, 77, 221, 0.2);
  border-color: var(--accent-purple);
  color: var(--accent-purple);
}

.drawing-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawing-stats {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 6px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-row .stat-value {
  font-weight: 600;
  color: var(--text-primary);
}

.drawing-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
</style>
