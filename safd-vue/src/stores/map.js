// 🔧 FIX 4: src/stores/map.js (AKTUALISIERT)
import { defineStore } from 'pinia'
import { mockApi } from '@/services/mockApi'

const isDev = import.meta.env.DEV
const api = isDev
  ? mockApi
  : {
      async load(type) {
        const response = await fetch(`./save_data.php?action=load&type=${type}`)
        return await response.json()
      },
      async save(type, data) {
        const response = await fetch(`./save_data.php?action=save&type=${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        })
        return await response.json()
      },
    }

export const useMapStore = defineStore('map', {
  state: () => ({
    map: null,
    zoomLevel: 2,
    center: [0, 0],
    mapStyle: 'road',
    drawings: {
      type: 'FeatureCollection',
      features: [],
    },
    layers: {
      hydrants: true,
      districts: true,
      routes: true,
      exclusions: true,
      drawings: true,
      // POI Category Layers
      gas_station: true,
      windmill: true,
      power_plant: true,
      oil_pump: true,
      tanks: true,
    },
  }),

  actions: {
    setMap(mapInstance) {
      this.map = mapInstance
      console.log('🗺️ Map instance gesetzt')
    },

    updateZoom(zoom) {
      this.zoomLevel = zoom
    },

    updateCenter(center) {
      this.center = center
    },

    setMapStyle(style) {
      this.mapStyle = style

      if (this.map) {
        // Hide all layers
        this.map.setLayoutProperty('road-layer', 'visibility', 'none')
        this.map.setLayoutProperty('satellite-layer', 'visibility', 'none')
        this.map.setLayoutProperty('atlas-layer', 'visibility', 'none')

        // Show selected layer
        this.map.setLayoutProperty(`${style}-layer`, 'visibility', 'visible')

        console.log(`🎨 Map Style gewechselt zu: ${style}`)
      }
    },

    toggleLayer(layerName) {
      this.layers[layerName] = !this.layers[layerName]
      console.log(`🔄 Layer ${layerName}: ${this.layers[layerName] ? 'AN' : 'AUS'}`)
    },

    async loadDrawings() {
      try {
        console.log(`📡 Lade Zeichnungen... (${isDev ? 'Mock API' : 'PHP API'})`)
        const result = await api.load('drawings')

        if (result.success) {
          this.drawings = result.data || { type: 'FeatureCollection', features: [] }
          console.log(`✅ ${this.drawings.features?.length || 0} Zeichnungen geladen`)
        }
      } catch (error) {
        console.error('❌ Drawings load error:', error)
      }
    },

    async saveDrawings() {
      try {
        const result = await api.save('drawings', this.drawings)
        if (result.success) {
          console.log('💾 Zeichnungen gespeichert')
        }
        return result.success
      } catch (error) {
        console.error('❌ Drawings save error:', error)
        return false
      }
    },
  },
})
