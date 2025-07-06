<template>
  <div
    style="
      position: fixed;
      top: 10px;
      left: 400px;
      background: black;
      color: white;
      padding: 10px;
      z-index: 9999;
      font-size: 12px;
    "
  >
    <div><strong>🔍 Debug Info:</strong></div>
    <div>Hydranten: {{ hydrantsStore.hydrants.length }}</div>
    <div>POIs: {{ poiStore.pois.length }}</div>
    <div>Selected: {{ hydrantsStore.selectedHydrant?.id || 'none' }}</div>
    <div>Map: {{ mapStore.map ? '✅' : '❌' }}</div>
    <button @click="testSelect" style="margin-top: 5px">Test Select Hydrant 1</button>
  </div>
</template>

<script setup>
import { useHydrantsStore } from '@/stores/hydrants'
import { usePOIStore } from '@/stores/pois'
import { useMapStore } from '@/stores/map'

const hydrantsStore = useHydrantsStore()
const poiStore = usePOIStore()
const mapStore = useMapStore()

const testSelect = () => {
  console.log('🧪 Test: Wähle Hydrant 1')
  hydrantsStore.selectHydrant(1)
}
</script>
