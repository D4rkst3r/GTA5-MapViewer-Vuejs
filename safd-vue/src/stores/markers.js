// src/stores/markers.js
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

export const useMarkersStore = defineStore('markers', {
  state: () => ({
    markers: [],
    selectedMarker: null,
    loading: false,
    error: null,
    filters: {
      category: '',
      search: '',
    },
  }),

  getters: {
    markerCount: (state) => state.markers.length,

    filteredMarkers: (state) => {
      let filtered = state.markers

      if (state.filters.category) {
        filtered = filtered.filter((m) => m.category === state.filters.category)
      }

      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(
          (m) =>
            m.name?.toLowerCase().includes(search) ||
            m.category?.toLowerCase().includes(search) ||
            m.description?.toLowerCase().includes(search),
        )
      }

      return filtered
    },

    markersByCategory: (state) => {
      const categories = {}
      state.markers.forEach((marker) => {
        if (!categories[marker.category]) {
          categories[marker.category] = []
        }
        categories[marker.category].push(marker)
      })
      return categories
    },
  },

  actions: {
    async fetchMarkers() {
      this.loading = true
      this.error = null

      try {
        console.log(`📡 Lade Markers... (${isDev ? 'Mock API' : 'PHP API'})`)
        const result = await api.load('markers')

        if (result.success) {
          this.markers = result.data || []
          console.log(`✅ ${this.markers.length} Markers geladen`)

          if (window.showToast) {
            window.showToast(`${this.markers.length} Markers geladen`, 'success', 2000)
          }
        } else {
          throw new Error('Fehler beim Laden der Markers')
        }
      } catch (error) {
        this.error = error.message
        console.error('❌ Marker fetch error:', error)

        if (window.showToast) {
          window.showToast('Fehler beim Laden der Markers', 'error')
        }
      } finally {
        this.loading = false
      }
    },

    async saveMarkers() {
      try {
        const result = await api.save('markers', this.markers)
        if (!result.success) {
          throw new Error('Fehler beim Speichern')
        }
        console.log('💾 Markers gespeichert')
        return true
      } catch (error) {
        this.error = error.message
        console.error('❌ Save error:', error)
        return false
      }
    },

    addMarker(marker) {
      const newId = Math.max(...this.markers.map((m) => m.id), 0) + 1
      const newMarker = {
        id: newId,
        ...marker,
      }

      this.markers.push(newMarker)
      console.log(`✅ Marker #${newId} hinzugefügt`)

      if (window.showToast) {
        window.showToast(`Marker "${newMarker.name}" hinzugefügt`, 'success')
      }

      this.saveMarkers()
      return newMarker
    },

    updateMarker(id, updates) {
      const index = this.markers.findIndex((m) => m.id === id)
      if (index !== -1) {
        this.markers[index] = { ...this.markers[index], ...updates }
        this.saveMarkers()

        if (window.showToast) {
          window.showToast(`Marker #${id} aktualisiert`, 'success')
        }
      }
    },

    deleteMarker(id) {
      const index = this.markers.findIndex((m) => m.id === id)
      if (index !== -1) {
        this.markers.splice(index, 1)
        this.saveMarkers()

        console.log(`🗑️ Marker #${id} gelöscht`)
        if (window.showToast) {
          window.showToast(`Marker #${id} gelöscht`, 'success')
        }
      }
    },

    selectMarker(id) {
      this.selectedMarker = this.markers.find((m) => m.id === id) || null
    },

    setCategoryFilter(category) {
      this.filters.category = category
    },

    setSearchFilter(search) {
      this.filters.search = search
    },

    clearFilters() {
      this.filters = {
        category: '',
        search: '',
      }
    },
  },
})
