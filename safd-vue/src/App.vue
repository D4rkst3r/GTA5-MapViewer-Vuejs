<!-- 🔧 FIX: src/App.vue (KORRIGIERT) -->
<template>
  <div id="app">
    <!-- 🔄 Loading Screen -->
    <LoadingScreen v-if="isLoading" />

    <!-- 🎮 Main Interface -->
    <div v-else class="app-layout">
      <!-- Top Controls -->
      <TopControls />

      <!-- Sidebar -->
      <Sidebar :is-open="sidebarOpen" />

      <!-- Map Container -->
      <MapContainer @map-ready="onMapReady" />

      <!-- Status Cards -->
      <StatusCards ref="statusCards" />

      <!-- Info Panel -->
      <InfoPanel />
      <!-- Global Modals -->
      <ConfirmModal
        v-model="showConfirmModal"
        :title="confirmData.title"
        :message="confirmData.message"
        @confirm="confirmData.resolve(true)"
        @decline="confirmData.resolve(false)"
      />

      <!-- Toast Notifications -->
      <ToastContainer />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { useHydrantsStore } from '@/stores/hydrants'
import { useMapStore } from '@/stores/map'
import { useUserStore } from '@/stores/user'
import { usePOIStore } from '@/stores/pois' // ← usePOIStore, nicht poiStore!
import { useMarkersStore } from '@/stores/markers'

// 📦 Components
import LoadingScreen from '@/components/LoadingScreen.vue'
import TopControls from '@/components/TopControls.vue'
import Sidebar from '@/components/NewSidebar.vue'
import MapContainer from '@/components/MapContainer.vue'
import StatusCards from '@/components/StatusCards.vue'
import InfoPanel from '@/components/InfoPanel.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

// 🏪 Stores
const hydrantsStore = useHydrantsStore()
const mapStore = useMapStore()
const userStore = useUserStore()
const poiStore = usePOIStore() // ← Das ist die Store-Instanz
const markersStore = useMarkersStore()

// 📊 Reactive State
const isLoading = ref(true)
const sidebarOpen = ref(false)
const statusCards = ref(null)

// 🎮 Methods - FIX: Korrekte toggleSidebar Funktion
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  console.log(`🎛️ Sidebar: ${sidebarOpen.value ? 'GEÖFFNET' : 'GESCHLOSSEN'}`)

  // Body Class für CSS Transitions
  if (sidebarOpen.value) {
    document.body.classList.add('sidebar-open')
  } else {
    document.body.classList.remove('sidebar-open')
  }
}

const onMapReady = (mapInstance) => {
  console.log('🗺️ Map ist bereit!')
  mapStore.setMap(mapInstance)

  // Map Event Listeners
  mapInstance.on('zoom', () => {
    mapStore.updateZoom(mapInstance.getZoom())
  })

  mapInstance.on('move', () => {
    mapStore.updateCenter(mapInstance.getCenter())
  })
}

// 📊 Global Modal State
const showConfirmModal = ref(false)
const confirmData = ref({
  title: '',
  message: '',
  resolve: () => {},
})

// 🌍 Global Confirm Function
const globalShowConfirm = (message, title = 'Bestätigung') => {
  return new Promise((resolve) => {
    confirmData.value = { title, message, resolve }
    showConfirmModal.value = true
  })
}

// 🎬 Provide Global Confirm
provide('showConfirm', globalShowConfirm)
window.showConfirm = globalShowConfirm

// 🚀 Application Initializatio

// App.vue - initializeApp() erweitern:
const initializeApp = async () => {
  try {
    console.log('🚀 Initialisiere SAFD Command Center...')

    // 1. User Settings laden
    userStore.loadSettings()

    // 2. Daten laden - POIs hinzufügen!
    await Promise.all([
      hydrantsStore.fetchHydrants(),
      poiStore.fetchPOIs(), // ← NEU
      markersStore.fetchMarkers(),
      mapStore.loadDrawings(),
    ])

    // 3. Loading beenden
    isLoading.value = false

    console.log('✅ App vollständig initialisiert!')
  } catch (error) {
    console.error('❌ App Initialisierung fehlgeschlagen:', error)
    isLoading.value = false
  }
}

// 🎬 Lifecycle
onMounted(() => {
  initializeApp()
})

// 🔌 Provide/Inject für Child Components - FIX
provide('toggleSidebar', toggleSidebar)
provide('statusCards', statusCards)

// 🐛 Debug: Test toggleSidebar
window.debugToggleSidebar = toggleSidebar
console.log('🔧 Debug: toggleSidebar Funktion verfügbar als window.debugToggleSidebar()')
</script>

<style>
/* 🎨 Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #ff4444;
  --primary-dark: #cc3333;
  --secondary-color: #ffffff;
  --background-dark: #1a1a1a;
  --background-darker: #0f0f0f;
  --surface: rgba(26, 26, 26, 0.95);
  --surface-hover: rgba(40, 40, 40, 0.95);
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --border-color: #333333;
  --accent-blue: #4287f5;
  --accent-orange: #ff8800;
  --accent-purple: #9d4edd;
  --danger: #ff4757;
  --success: #2ed573;
  --warning: #ffa502;
}

body {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--background-darker);
  color: var(--text-primary);
  overflow: hidden;
  line-height: 1.6;
}

#app {
  width: 100vw;
  height: 100vh;
}

.app-layout {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 🎛️ Sidebar Animation CSS */
body.sidebar-open .top-controls {
  left: 400px !important;
}

body.sidebar-open .status-grid {
  left: 400px !important;
}

/* 🔄 Loading Animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 💫 Smooth Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* 📱 Responsive */
@media (max-width: 768px) {
  .app-layout {
    font-size: 14px;
  }

  body.sidebar-open .top-controls,
  body.sidebar-open .status-grid {
    opacity: 0 !important;
    pointer-events: none !important;
  }
}
</style>
