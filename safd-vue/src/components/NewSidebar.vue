<!-- src/components/Sidebar.vue - MIT BEARBEITUNGSFUNKTION -->
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
          <div class="stat-item">
            <span class="stat-value">{{ hydrantStats.maintenance }}</span>
            <span class="stat-label">Wartung fällig</span>
          </div>
        </div>

        <!-- ✅ NEUER HYDRANT BUTTON -->
        <button v-if="userStore.isAdmin" @click="startAddingHydrant()" class="modern-button">
          <i class="fas fa-plus"></i>
          Neuen Hydranten hinzufügen
        </button>

        <!-- ✅ HYDRANTENLISTE MIT BEARBEITUNG -->
        <div class="hydrant-list-section">
          <div class="section-header">
            <h4>Hydranten Liste</h4>
            <button @click="toggleHydrantList" class="toggle-btn">
              <i :class="showHydrantList ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            </button>
          </div>

          <div v-if="showHydrantList" class="hydrant-list">
            <div
              v-for="hydrant in filteredHydrants"
              :key="hydrant.id"
              class="hydrant-item"
              :class="{ 'maintenance-due': hydrant.maintenanceDue }"
            >
              <div class="hydrant-info">
                <div class="hydrant-title">
                  <i
                    class="fas fa-fire-hydrant"
                    :style="{ color: getStatusColor(hydrant.status) }"
                  ></i>
                  Hydrant #{{ hydrant.id }}
                </div>
                <div class="hydrant-details">
                  {{ hydrant.area }} • {{ hydrant.type }} • {{ hydrant.status }}
                </div>
              </div>
              <div class="hydrant-actions">
                <!-- ✅ BEARBEITEN BUTTON - Verwendet openHydrantForm -->
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

        <button @click="showMaintenanceModal" class="modern-button button-secondary">
          <i class="fas fa-wrench"></i>
          Wartungsübersicht
        </button>
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

      <!-- Drawing Tools -->
      <SidebarSection title="Zeichentools" icon="fas fa-pen">
        <div class="drawing-status">
          <div class="status-indicator ready">
            <i class="fas fa-check-circle"></i>
            <span>Zeichentools bereit</span>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">Zeichenmodus</label>
          <select v-model="drawingMode" class="modern-select" @change="changeDrawingMode">
            <option value="simple_select">Auswählen & Bearbeiten</option>
            <option value="draw_point">Punkt zeichnen</option>
            <option value="draw_line_string">Linie zeichnen</option>
            <option value="draw_polygon">Polygon zeichnen</option>
          </select>
        </div>

        <button class="modern-button button-warning" @click="clearAllDrawings">
          <i class="fas fa-trash"></i>
          Zeichnungen löschen
        </button>

        <button class="modern-button button-secondary" @click="exportDrawings">
          <i class="fas fa-download"></i>
          Exportieren
        </button>
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

// 🎭 Modal State (lokal verwaltet)
const modalData = ref({
  hydrant: null,
  poi: null,
})
const showHydrantForm = ref(false)
const showPOIForm = ref(false)

// 📊 Reactive Data
const drawingMode = ref('simple_select')
const showHydrantList = ref(false) // ✅ NEU: Toggle für Hydrantenliste

// 🧮 Computed Properties
const districts = computed(() => {
  const allDistricts = hydrantsStore.hydrants.map((h) => h.area).filter(Boolean)
  return [...new Set(allDistricts)].sort()
})

// ✅ NEU: Gefilterte Hydranten
const filteredHydrants = computed(() => {
  let hydrants = hydrantsStore.hydrants

  // Filter nach Bezirk
  if (hydrantsStore.filters.district) {
    hydrants = hydrants.filter((h) => h.area === hydrantsStore.filters.district)
  }

  // Filter nach Suche
  if (hydrantsStore.filters.search) {
    const search = hydrantsStore.filters.search.toLowerCase()
    hydrants = hydrants.filter(
      (h) =>
        h.id.toString().includes(search) ||
        h.area?.toLowerCase().includes(search) ||
        h.status?.toLowerCase().includes(search),
    )
  }

  return hydrants.slice(0, 10) // Maximal 10 anzeigen
})

// ✅ NEU: Hydrant Stats
const hydrantStats = computed(() => {
  return {
    maintenance: hydrantsStore.hydrants.filter((h) => h.maintenanceDue).length,
  }
})

// 🎮 Methods
const onMapStyleChange = () => {
  mapStore.setMapStyle(mapStore.mapStyle)
}

const changeDrawingMode = () => {
  console.log(`🎨 Drawing Mode: ${drawingMode.value}`)
}

const clearAllDrawings = async () => {
  const confirmed = await showConfirm('Alle Zeichnungen wirklich löschen?', 'Zeichnungen löschen')

  if (confirmed) {
    mapStore.drawings.features = []
    mapStore.saveDrawings()
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

const showMaintenanceModal = () => {
  showToast('Wartungsübersicht öffnet sich...', 'info')
}

// ✅ NEUE HYDRANTEN-FUNKTIONEN
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

// ✅ BEARBEITUNGSFUNKTION - Verwendet openHydrantForm
const openHydrantForm = (hydrant = null) => {
  modalData.value.hydrant = hydrant
  showHydrantForm.value = true
  console.log('📝 Hydrant-Form geöffnet:', hydrant ? `#${hydrant.id}` : 'Neu')
}

// ✅ NEU: Hydrant löschen
const deleteHydrant = async (hydrantId) => {
  const confirmed = await showConfirm(`Hydrant #${hydrantId} wirklich löschen?`, 'Hydrant löschen')

  if (confirmed) {
    hydrantsStore.deleteHydrant(hydrantId)
    showToast(`Hydrant #${hydrantId} gelöscht`, 'success')
  }
}

// ✅ NEU: Status-Farben
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
  console.log('🚒 Hydrant gespeichert:', hydrantData)

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
  console.log('🏭 POI gespeichert:', poiData)

  if (poiData.isEditing) {
    poiStore.updatePOI(poiData.id, poiData)
  } else {
    uiStore.pendingPOIData = poiData
    uiStore.isAddingPOI = true
    showToast('Klicke auf die Karte, um den POI zu platzieren', 'info')
  }

  showPOIForm.value = false
}

// 🔧 Utility Functions
const showConfirm = async (message, title = 'Bestätigung') => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n\n${message}`)
    resolve(confirmed)
  })
}

const showToast = (message, type = 'info', duration = 3000) => {
  console.log(`🍞 Toast [${type}]: ${message}`)

  if (window.showToast) {
    window.showToast(message, type, duration)
  } else {
    if (type === 'error') {
      alert(`❌ ${message}`)
    } else if (type === 'success') {
      alert(`✅ ${message}`)
    } else {
      alert(`ℹ️ ${message}`)
    }
  }
}

// 🎬 Lifecycle
onMounted(() => {
  console.log('🎛️ Sidebar geladen')
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

.drawing-status {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-indicator.ready {
  color: var(--success);
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

/* ===== ✅ NEUE HYDRANTENLISTE STYLES ===== */
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
</style>
