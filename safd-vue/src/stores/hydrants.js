// 🔧 FIX 3: src/stores/hydrants.js (AKTUALISIERT)
import { defineStore } from 'pinia'
import { mockApi } from '@/services/mockApi'

// 🌍 Development vs Production API
const isDev = import.meta.env.DEV
const api = isDev ? mockApi : {
  async load(type) {
    const response = await fetch(`./save_data.php?action=load&type=${type}`)
    return await response.json()
  },
  async save(type, data) {
    const response = await fetch(`./save_data.php?action=save&type=${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    })
    return await response.json()
  }
}

export const useHydrantsStore = defineStore('hydrants', {
  state: () => ({
    hydrants: [],
    selectedHydrant: null,
    loading: false,
    error: null,
    filters: {
      district: '',
      status: '',
      search: ''
    }
  }),

  getters: {
    hydrantCount: (state) => state.hydrants.length,

    filteredHydrants: (state) => {
      let filtered = state.hydrants

      if (state.filters.district) {
        filtered = filtered.filter(h => h.area === state.filters.district)
      }

      if (state.filters.status) {
        filtered = filtered.filter(h => h.status === state.filters.status)
      }

      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(h =>
          h.id.toString().includes(search) ||
          h.area?.toLowerCase().includes(search) ||
          h.status?.toLowerCase().includes(search) ||
          h.type?.toLowerCase().includes(search)
        )
      }

      return filtered
    },

    maintenanceOverdue: (state) => {
      const today = new Date()
      return state.hydrants.filter(hydrant => {
        if (!hydrant.nextService) return false
        const nextService = new Date(hydrant.nextService)
        return nextService < today
      })
    }
  },

  actions: {
    async fetchHydrants() {
      this.loading = true
      this.error = null

      try {
        console.log(`📡 Lade Hydranten... (${isDev ? 'Mock API' : 'PHP API'})`)
        const result = await api.load('hydrants')

        if (result.success) {
          this.hydrants = result.data || []
          console.log(`✅ ${this.hydrants.length} Hydranten geladen`)

          // Toast anzeigen
          if (window.showToast) {
            window.showToast(`${this.hydrants.length} Hydranten geladen`, 'success', 2000)
          }
        } else {
          throw new Error('Fehler beim Laden der Hydranten')
        }
      } catch (error) {
        this.error = error.message
        console.error('❌ Hydrant fetch error:', error)

        if (window.showToast) {
          window.showToast('Fehler beim Laden der Hydranten', 'error')
        }
      } finally {
        this.loading = false
      }
    },

    async saveHydrants() {
      try {
        const result = await api.save('hydrants', this.hydrants)
        if (!result.success) {
          throw new Error('Fehler beim Speichern')
        }

        console.log('💾 Hydranten gespeichert')
        return true
      } catch (error) {
        this.error = error.message
        console.error('❌ Save error:', error)
        return false
      }
    },

    addHydrant(hydrant) {
      const newId = Math.max(...this.hydrants.map(h => h.id), 0) + 1
      const newHydrant = {
        id: newId,
        ...hydrant
      }

      this.hydrants.push(newHydrant)
      console.log(`✅ Hydrant #${newId} hinzugefügt`)

      if (window.showToast) {
        window.showToast(`Hydrant #${newId} hinzugefügt`, 'success')
      }

      this.saveHydrants()
      return newHydrant
    },

    updateHydrant(id, updates) {
      const index = this.hydrants.findIndex(h => h.id === id)
      if (index !== -1) {
        this.hydrants[index] = { ...this.hydrants[index], ...updates }
        this.saveHydrants()

        if (window.showToast) {
          window.showToast(`Hydrant #${id} aktualisiert`, 'success')
        }
      }
    },

    deleteHydrant(id) {
      const index = this.hydrants.findIndex(h => h.id === id)
      if (index !== -1) {
        this.hydrants.splice(index, 1)
        this.saveHydrants()

        console.log(`🗑️ Hydrant #${id} gelöscht`)
        if (window.showToast) {
          window.showToast(`Hydrant #${id} gelöscht`, 'success')
        }
      }
    },

    selectHydrant(id) {
      this.selectedHydrant = this.hydrants.find(h => h.id === id) || null
    },

    setDistrictFilter(district) {
      this.filters.district = district
    },

    setStatusFilter(status) {
      this.filters.status = status
    },

    setSearchFilter(search) {
      this.filters.search = search
    },

    clearFilters() {
      this.filters = {
        district: '',
        status: '',
        search: ''
      }
    }
  }
})

// ========================================

