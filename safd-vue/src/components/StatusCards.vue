<!-- src/components/StatusCards.vue -->
<template>
  <div class="status-grid">
    <div class="status-card" :class="{ updating: hydrantsUpdating }">
      <div class="status-value">{{ hydrantCount }}</div>
      <div class="status-label">Hydranten</div>
    </div>

    <div class="status-card" :class="{ updating: maintenanceUpdating }">
      <div class="status-value">{{ maintenanceCount }}</div>
      <div class="status-label">Wartung fällig</div>
    </div>

    <div class="status-card" :class="{ updating: drawingsUpdating }">
      <div class="status-value">{{ drawingCount }}</div>
      <div class="status-label">Zeichnungen</div>
    </div>

    <div class="status-card">
      <div class="status-value">{{ zoomLevel }}</div>
      <div class="status-label">Zoom</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHydrantsStore } from '@/stores/hydrants'
import { useMapStore } from '@/stores/map'

// 🏪 Stores (State Management)
const hydrantsStore = useHydrantsStore()
const mapStore = useMapStore()

// 📊 Reactive Data
const hydrantsUpdating = ref(false)
const maintenanceUpdating = ref(false)
const drawingsUpdating = ref(false)

// 🧮 Computed Properties (werden automatisch aktualisiert)
const hydrantCount = computed(() => hydrantsStore.hydrants.length)

const maintenanceCount = computed(() => {
  const today = new Date()
  return hydrantsStore.hydrants.filter((hydrant) => {
    if (!hydrant.nextService) return false
    const nextService = new Date(hydrant.nextService)
    return nextService < today
  }).length
})

const drawingCount = computed(() => mapStore.drawings?.features?.length || 0)

const zoomLevel = computed(() => Math.round(mapStore.zoomLevel * 10) / 10)

// 🎬 Lifecycle
onMounted(() => {
  console.log('✅ StatusCards Komponente geladen!')
})

// 💫 Animation Helpers
const triggerUpdateAnimation = (cardType) => {
  switch (cardType) {
    case 'hydrants':
      hydrantsUpdating.value = true
      setTimeout(() => (hydrantsUpdating.value = false), 1500)
      break
    case 'maintenance':
      maintenanceUpdating.value = true
      setTimeout(() => (maintenanceUpdating.value = false), 1500)
      break
    case 'drawings':
      drawingsUpdating.value = true
      setTimeout(() => (drawingsUpdating.value = false), 1500)
      break
  }
}

// 📤 Expose functions for parent components
defineExpose({
  triggerUpdateAnimation,
})
</script>

<style scoped>
/* 🎨 Lokale Styles für diese Komponente */
.status-grid {
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  z-index: 999;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-card {
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid #333333;
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(20px);
  text-align: center;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.status-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 4px;
}

.status-label {
  font-size: 12px;
  color: #cccccc;
}

/* 🌟 Update Animation */
.status-card.updating {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 5px #2ed573;
  }
  50% {
    box-shadow: 0 0 20px #2ed573;
  }
}

.status-card.updating {
  animation: glow 1.5s ease-in-out;
}

/* 📱 Responsive Design */
@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
    left: 10px;
    right: 10px;
  }
}
</style>
