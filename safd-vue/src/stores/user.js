// 👤 src/stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    isAdmin: false,
    autoSaveEnabled: true,
    lastSaveTime: null,
  }),

  actions: {
    toggleAdmin() {
      if (this.isAdmin) {
        // Logout
        this.isAdmin = false
        localStorage.removeItem('isAdmin')
        console.log('👤 Admin-Modus deaktiviert')
      } else {
        // Login
        const password = prompt('Admin-Passwort eingeben:')
        if (password === 'firechief2025') {
          this.isAdmin = true
          localStorage.setItem('isAdmin', 'true')
          console.log('👤 Admin-Modus aktiviert')
        } else {
          alert('Falsches Passwort!')
        }
      }
    },

    loadSettings() {
      this.isAdmin = localStorage.getItem('isAdmin') === 'true'
    },

    toggleAutoSave() {
      this.autoSaveEnabled = !this.autoSaveEnabled
      console.log(`💾 Auto-Save: ${this.autoSaveEnabled ? 'AN' : 'AUS'}`)
    },
  },
})
