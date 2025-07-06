<!-- 🔧 FIX: src/components/TopControls.vue (KORRIGIERT) -->
<template>
  <div class="top-controls">
    <button class="control-button tooltip" @click="handleMenuClick" data-tooltip="Menü öffnen">
      <i class="fas fa-bars"></i>
    </button>

    <button class="control-button tooltip" @click="centerOnLosSantos" data-tooltip="Zentrum">
      <i class="fas fa-crosshairs"></i>
    </button>

    <button class="control-button tooltip" @click="showAllHydrants" data-tooltip="Alle Hydranten">
      <i class="fas fa-eye"></i>
    </button>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useMapStore } from '@/stores/map'

// 🏪 Store
const mapStore = useMapStore()

// 🔌 Injections - FIX: Korrekte Verwendung
const toggleSidebar = inject('toggleSidebar', null)

// 🎮 Methods
const handleMenuClick = () => {
  console.log('🍔 Menu Button geklickt')
  if (toggleSidebar) {
    toggleSidebar()
    console.log('✅ Sidebar toggle aufgerufen')
  } else {
    console.error('❌ toggleSidebar Funktion nicht verfügbar!')
  }
}

const centerOnLosSantos = () => {
  console.log('🎯 Zentriere auf Los Santos')
  if (mapStore.map) {
    mapStore.map.flyTo({
      center: [0, 0],
      zoom: 2,
      duration: 2000,
    })
  }
}

const showAllHydrants = () => {
  console.log('👁️ Zeige alle Hydranten')
  if (mapStore.map) {
    // Wird später über MapContainer Ref implementiert
    console.log('🔍 Zeige alle Hydranten - Feature kommt noch')
  }
}
</script>

<style scoped>
.top-controls {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  display: flex;
  gap: 12px;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-button {
  width: 48px;
  height: 48px;
  background: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
  backdrop-filter: blur(20px);
}

.control-button:hover {
  background: var(--surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.control-button.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

/* Tooltip */
.tooltip {
  position: relative;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--background-dark);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 1000;
  margin-bottom: 5px;
}

.tooltip:hover::after {
  opacity: 1;
}
</style>

<!-- ========================================= -->
