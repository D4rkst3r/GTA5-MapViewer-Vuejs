<!-- src/components/InfoPanel.vue (KORRIGIERT & ERWEITERT) -->
<template>
  <div class="info-panel" :class="{ active: isVisible }">
    <div class="info-header" :style="headerStyle">
      <div>
        <i :class="headerIcon"></i>
        {{ headerTitle }}
      </div>
      <button class="close-button" @click="close">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="info-content">
      <!-- 🚒 Hydrant Info -->
      <div v-if="selectedHydrant" class="animate-in">
        <div class="object-title">
          <i class="fas fa-fire-hydrant"></i>
          Hydrant #{{ selectedHydrant.id }}
        </div>

        <InfoSection title="Position" icon="fas fa-map-marker-alt">
          <InfoItem label="Longitude" :value="selectedHydrant.lng?.toFixed(6)" />
          <InfoItem label="Latitude" :value="selectedHydrant.lat?.toFixed(6)" />
          <InfoItem label="Gebiet" :value="selectedHydrant.area" />
        </InfoSection>

        <InfoSection title="Details" icon="fas fa-info-circle">
          <InfoItem label="Typ" :value="selectedHydrant.type" />
          <InfoItem
            label="Status"
            :value="selectedHydrant.status"
            :status="selectedHydrant.status"
          />
        </InfoSection>

        <InfoSection title="Wartung" icon="fas fa-wrench">
          <InfoItem label="Letzter Service" :value="selectedHydrant.lastService" />
          <InfoItem label="Nächster Service" :value="selectedHydrant.nextService" />
          <InfoItem label="Status" :value="maintenanceStatus" :status="maintenanceStatusLevel" />
        </InfoSection>

        <!-- Admin Actions -->
        <div v-if="userStore.isAdmin" class="action-buttons">
          <button class="btn btn-primary" @click="editHydrant">
            <i class="fas fa-edit"></i>
            Bearbeiten
          </button>
          <button class="btn btn-danger" @click="deleteHydrant">
            <i class="fas fa-trash"></i>
            Löschen
          </button>
        </div>
      </div>

      <!-- 🏭 POI Info -->
      <div v-else-if="selectedPOI" class="animate-in">
        <div class="object-title">
          <i :class="poiIcon"></i>
          {{ selectedPOI.name }}
        </div>

        <InfoSection title="Position" icon="fas fa-map-marker-alt">
          <InfoItem label="Longitude" :value="selectedPOI.lng?.toFixed(6)" />
          <InfoItem label="Latitude" :value="selectedPOI.lat?.toFixed(6)" />
        </InfoSection>

        <InfoSection title="Details" icon="fas fa-info-circle">
          <InfoItem label="Kategorie" :value="poiCategoryName" />
          <InfoItem
            label="Priorität"
            :value="selectedPOI.priority"
            :status="selectedPOI.priority"
          />
          <InfoItem label="Beschreibung" :value="selectedPOI.description" />
        </InfoSection>

        <!-- POI-spezifische Felder -->
        <InfoSection v-if="hasPOISpecificFields" title="Spezifische Daten" icon="fas fa-cog">
          <InfoItem
            v-if="selectedPOI.openingHours"
            label="Öffnungszeiten"
            :value="selectedPOI.openingHours"
          />
          <InfoItem
            v-if="selectedPOI.fuelTypes"
            label="Kraftstoffe"
            :value="selectedPOI.fuelTypes"
          />
          <InfoItem
            v-if="selectedPOI.voltage"
            label="Spannung"
            :value="`${selectedPOI.voltage} kV`"
          />
          <InfoItem
            v-if="selectedPOI.capacity"
            label="Leistung"
            :value="`${selectedPOI.capacity} MW`"
          />
        </InfoSection>

        <!-- Admin Actions -->
        <div v-if="userStore.isAdmin" class="action-buttons">
          <button class="btn btn-primary" @click="editPOI">
            <i class="fas fa-edit"></i>
            Bearbeiten
          </button>
          <button class="btn btn-danger" @click="deletePOI">
            <i class="fas fa-trash"></i>
            Löschen
          </button>
        </div>
      </div>

      <!-- 📍 Marker Info -->
      <div v-else-if="selectedMarker" class="animate-in">
        <div class="object-title">
          <i :class="markerIcon"></i>
          {{ selectedMarker.name }}
        </div>

        <InfoSection title="Position" icon="fas fa-map-marker-alt">
          <InfoItem label="Longitude" :value="selectedMarker.lng?.toFixed(6)" />
          <InfoItem label="Latitude" :value="selectedMarker.lat?.toFixed(6)" />
        </InfoSection>

        <InfoSection title="Details" icon="fas fa-info-circle">
          <InfoItem label="Kategorie" :value="markerCategoryName" />
          <InfoItem
            label="Priorität"
            :value="selectedMarker.priority"
            :status="selectedMarker.priority"
          />
          <InfoItem label="Beschreibung" :value="selectedMarker.description" />
        </InfoSection>

        <!-- Marker-spezifische Felder -->
        <InfoSection v-if="hasMarkerSpecificFields" title="Spezifische Daten" icon="fas fa-cog">
          <InfoItem
            v-if="selectedMarker.routeType"
            label="Anfahrtstyp"
            :value="getRouteTypeName(selectedMarker.routeType)"
          />
          <InfoItem
            v-if="selectedMarker.capacity"
            label="Kapazität"
            :value="`${selectedMarker.capacity} Personen`"
          />
          <InfoItem
            v-if="selectedMarker.warningType"
            label="Warnungstyp"
            :value="getWarningTypeName(selectedMarker.warningType)"
          />
          <InfoItem
            v-if="selectedMarker.starType"
            label="Markierungstyp"
            :value="getStarTypeName(selectedMarker.starType)"
          />
        </InfoSection>

        <!-- Admin Actions -->
        <div v-if="userStore.isAdmin" class="action-buttons">
          <button class="btn btn-primary" @click="editMarker">
            <i class="fas fa-edit"></i>
            Bearbeiten
          </button>
          <button class="btn btn-danger" @click="deleteMarker">
            <i class="fas fa-trash"></i>
            Löschen
          </button>
        </div>
      </div>

      <!-- Default State -->
      <div v-else class="empty-state">
        <i class="fas fa-mouse-pointer"></i>
        <p>Wähle einen Hydranten, POI oder Marker aus...</p>
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

  <MarkerForm v-model="showMarkerForm" :marker="modalData.marker" @marker-saved="onMarkerSaved" />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useHydrantsStore } from '@/stores/hydrants'
import { usePOIStore } from '@/stores/pois'
import { useMarkersStore } from '@/stores/markers'
import { useUserStore } from '@/stores/user'
import { useModals } from '@/composables/useModals'

// Components
import InfoSection from './InfoSection.vue'
import InfoItem from './InfoItem.vue'
import HydrantForm from './HydrantForm.vue'
import POIForm from './POIForm.vue'
import MarkerForm from './MarkerForm.vue'

// 🏪 Stores
const hydrantsStore = useHydrantsStore()
const poiStore = usePOIStore()
const markersStore = useMarkersStore()
const userStore = useUserStore()

// 🎭 Modals
const { modalData, showConfirm } = useModals()
const showHydrantForm = ref(false)
const showPOIForm = ref(false)
const showMarkerForm = ref(false)

// 📊 Selected Objects
const selectedHydrant = computed(() => hydrantsStore.selectedHydrant)
const selectedPOI = computed(() => poiStore.selectedPOI)
const selectedMarker = computed(() => markersStore.selectedMarker)

// 🧮 Computed Properties
const isVisible = computed(() => {
  return !!(selectedHydrant.value || selectedPOI.value || selectedMarker.value)
})

const objectType = computed(() => {
  if (selectedHydrant.value) return 'hydrant'
  if (selectedPOI.value) return 'poi'
  if (selectedMarker.value) return 'marker'
  return null
})

// 🎨 Dynamic Header
const headerStyle = computed(() => {
  const colors = {
    hydrant: 'var(--primary-color)',
    poi: '#ff6b35',
    marker: '#9d4edd',
  }
  const color = colors[objectType.value] || 'var(--accent-blue)'
  return {
    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
  }
})

const headerIcon = computed(() => {
  const icons = {
    hydrant: 'fas fa-fire-hydrant',
    poi: 'fas fa-landmark',
    marker: 'fas fa-map-marker-alt',
  }
  return icons[objectType.value] || 'fas fa-info-circle'
})

const headerTitle = computed(() => {
  const titles = {
    hydrant: 'Hydrant Details',
    poi: 'POI Details',
    marker: 'Marker Details',
  }
  return titles[objectType.value] || 'Objekt Details'
})

// 🚒 Hydrant Specific
const maintenanceStatus = computed(() => {
  if (!selectedHydrant.value?.nextService) return 'Unbekannt'

  const today = new Date()
  const nextService = new Date(selectedHydrant.value.nextService)
  const daysUntil = Math.ceil((nextService - today) / (1000 * 60 * 60 * 24))

  if (daysUntil < 0) {
    return `Überfällig (${Math.abs(daysUntil)} Tage)`
  } else if (daysUntil < 30) {
    return `Anstehend (${daysUntil} Tage)`
  } else {
    return 'Aktuell'
  }
})

const maintenanceStatusLevel = computed(() => {
  if (!selectedHydrant.value?.nextService) return 'unknown'

  const today = new Date()
  const nextService = new Date(selectedHydrant.value.nextService)
  const daysUntil = Math.ceil((nextService - today) / (1000 * 60 * 60 * 24))

  if (daysUntil < 0) return 'error'
  if (daysUntil < 30) return 'warning'
  return 'success'
})

// 🏭 POI Specific
const poiCategories = {
  gas_station: { name: 'Tankstelle', icon: 'fas fa-gas-pump' },
  windmill: { name: 'Windrad', icon: 'fas fa-wind' },
  power_plant: { name: 'Umspannwerk', icon: 'fas fa-bolt' },
  oil_pump: { name: 'Ölpumpe', icon: 'fas fa-oil-well' },
  tanks: { name: 'Tanks', icon: 'fas fa-database' },
}

const poiIcon = computed(() => {
  return poiCategories[selectedPOI.value?.category]?.icon || 'fas fa-landmark'
})

const poiCategoryName = computed(() => {
  return poiCategories[selectedPOI.value?.category]?.name || selectedPOI.value?.category
})

const hasPOISpecificFields = computed(() => {
  if (!selectedPOI.value) return false
  return !!(
    selectedPOI.value.openingHours ||
    selectedPOI.value.fuelTypes ||
    selectedPOI.value.voltage ||
    selectedPOI.value.capacity
  )
})

// 📍 Marker Specific
const markerCategories = {
  route: { name: 'Anfahrtsweg', icon: 'fas fa-route' },
  assembly: { name: 'Sammelplatz', icon: 'fas fa-users' },
  warning: { name: 'Warnung', icon: 'fas fa-exclamation-triangle' },
  star: { name: 'Markierung', icon: 'fas fa-star' },
  staging: { name: 'Bereitstellung', icon: 'fas fa-truck' },
  command: { name: 'Führungsstelle', icon: 'fas fa-flag' },
}

const markerIcon = computed(() => {
  return markerCategories[selectedMarker.value?.category]?.icon || 'fas fa-map-marker-alt'
})

const markerCategoryName = computed(() => {
  return markerCategories[selectedMarker.value?.category]?.name || selectedMarker.value?.category
})

const hasMarkerSpecificFields = computed(() => {
  if (!selectedMarker.value) return false
  return !!(
    selectedMarker.value.routeType ||
    selectedMarker.value.capacity ||
    selectedMarker.value.warningType ||
    selectedMarker.value.starType
  )
})

// 📍 Marker Helper Functions
const getRouteTypeName = (routeType) => {
  const routeTypes = {
    primary: 'Hauptanfahrt',
    secondary: 'Nebenroute',
    emergency: 'Notfallroute',
    evacuation: 'Evakuierungsweg',
  }
  return routeTypes[routeType] || routeType
}

const getWarningTypeName = (warningType) => {
  const warningTypes = {
    danger: 'Gefahr',
    restricted: 'Sperrbereich',
    hazmat: 'Gefahrstoff',
    radiation: 'Strahlung',
  }
  return warningTypes[warningType] || warningType
}

const getStarTypeName = (starType) => {
  const starTypes = {
    poi: 'Wichtiger Ort',
    landmark: 'Orientierungspunkt',
    meeting: 'Treffpunkt',
    staging: 'Bereitstellungsraum',
  }
  return starTypes[starType] || starType
}

// 🎮 Methods
const close = () => {
  hydrantsStore.selectHydrant(null)
  poiStore.selectPOI(null)
  markersStore.selectMarker(null)
}

// 🚒 Hydrant Actions
const editHydrant = () => {
  modalData.value.hydrant = selectedHydrant.value
  showHydrantForm.value = true
}

const deleteHydrant = async () => {
  const confirmed = await showConfirm(
    `Hydrant #${selectedHydrant.value.id} wirklich löschen?`,
    'Hydrant löschen',
  )

  if (confirmed) {
    hydrantsStore.deleteHydrant(selectedHydrant.value.id)
    close()
  }
}

const onHydrantSaved = (data) => {
  console.log('🚒 Hydrant gespeichert:', data)
}

// 🏭 POI Actions
const editPOI = () => {
  modalData.value.poi = selectedPOI.value
  showPOIForm.value = true
}

const deletePOI = async () => {
  const confirmed = await showConfirm(
    `POI "${selectedPOI.value.name}" wirklich löschen?`,
    'POI löschen',
  )

  if (confirmed) {
    poiStore.deletePOI(selectedPOI.value.id)
    close()
  }
}

const onPOISaved = (data) => {
  console.log('🏭 POI gespeichert:', data)
}

// 📍 Marker Actions
const editMarker = () => {
  modalData.value.marker = selectedMarker.value
  showMarkerForm.value = true
}

const deleteMarker = async () => {
  const confirmed = await showConfirm(
    `Marker "${selectedMarker.value.name}" wirklich löschen?`,
    'Marker löschen',
  )

  if (confirmed) {
    markersStore.deleteMarker(selectedMarker.value.id)
    close()
  }
}

const onMarkerSaved = (data) => {
  console.log('📍 Marker gespeichert:', data)
}

// 🔍 Debug
onMounted(() => {
  console.log('✅ InfoPanel (erweitert) geladen')

  // Debug Watchers
  watch(
    () => selectedHydrant.value,
    (val) => {
      console.log('🚒 Selected Hydrant:', val)
    },
  )

  watch(
    () => selectedPOI.value,
    (val) => {
      console.log('🏭 Selected POI:', val)
    },
  )

  watch(
    () => selectedMarker.value,
    (val) => {
      console.log('📍 Selected Marker:', val)
    },
  )
})
</script>

<style scoped>
.info-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 40px);
  background: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  overflow: hidden;
  transform: translateX(400px);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1002;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.info-panel.active {
  transform: translateX(0);
}

.info-header {
  padding: 20px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.3s ease;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.info-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
}

.object-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-blue);
  color: white;
}

.btn-primary:hover {
  background: #3167c7;
  transform: translateY(-1px);
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-danger:hover {
  background: #e74c3c;
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 20px;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.animate-in {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Status-spezifische Farben für Priority */
.info-item .value.status-critical {
  color: var(--danger);
}

.info-item .value.status-high {
  color: var(--warning);
}

.info-item .value.status-normal {
  color: var(--text-primary);
}

.info-item .value.status-low {
  color: var(--text-secondary);
}
</style>
