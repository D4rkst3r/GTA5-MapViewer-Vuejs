// src/stores/pois.js
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

export const usePOIStore = defineStore('pois', {
  state: () => ({
    pois: [],
    selectedPOI: null,
    loading: false,
    error: null,
    filters: {
      category: '',
      search: '',
    },
  }),

  getters: {
    poiCount: (state) => state.pois.length,

    filteredPOIs: (state) => {
      let filtered = state.pois

      if (state.filters.category) {
        filtered = filtered.filter((p) => p.category === state.filters.category)
      }

      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.name?.toLowerCase().includes(search) || p.category?.toLowerCase().includes(search),
        )
      }

      return filtered
    },
  },

  actions: {
    async fetchPOIs() {
      this.loading = true
      this.error = null

      try {
        console.log(`📡 Lade POIs... (${isDev ? 'Mock API' : 'PHP API'})`)
        const result = await api.load('pois')

        if (result.success) {
          this.pois = result.data || []
          console.log(`✅ ${this.pois.length} POIs geladen`)
        } else {
          throw new Error('Fehler beim Laden der POIs')
        }
      } catch (error) {
        this.error = error.message
        console.error('❌ POI fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async savePOIs() {
      try {
        const result = await api.save('pois', this.pois)
        if (!result.success) {
          throw new Error('Fehler beim Speichern')
        }
        console.log('💾 POIs gespeichert')
        return true
      } catch (error) {
        this.error = error.message
        console.error('❌ Save error:', error)
        return false
      }
    },

    addPOI(poi) {
      const newId = Math.max(...this.pois.map((p) => p.id), 0) + 1
      const newPOI = {
        id: newId,
        ...poi,
      }

      this.pois.push(newPOI)
      console.log(`✅ POI #${newId} hinzugefügt`)

      if (window.showToast) {
        window.showToast(`POI "${newPOI.name}" hinzugefügt`, 'success')
      }

      this.savePOIs()
      return newPOI
    },

    updatePOI(id, updates) {
      const index = this.pois.findIndex((p) => p.id === id)
      if (index !== -1) {
        this.pois[index] = { ...this.pois[index], ...updates }
        this.savePOIs()

        if (window.showToast) {
          window.showToast(`POI #${id} aktualisiert`, 'success')
        }
      }
    },

    deletePOI(id) {
      const index = this.pois.findIndex((p) => p.id === id)
      if (index !== -1) {
        this.pois.splice(index, 1)
        this.savePOIs()

        console.log(`🗑️ POI #${id} gelöscht`)
        if (window.showToast) {
          window.showToast(`POI #${id} gelöscht`, 'success')
        }
      }
    },

    selectPOI(id) {
      this.selectedPOI = this.pois.find((p) => p.id === id) || null
    },
  },
})
