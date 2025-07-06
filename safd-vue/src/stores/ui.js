// stores/ui.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', () => {
  // 🎯 Position Picking State
  const isAddingHydrant = ref(false)
  const isAddingPOI = ref(false)
  const isAddingMarker = ref(false)

  // 📝 Pending Data für Position Picking
  const pendingHydrantData = ref(null)
  const pendingPOIData = ref(null)
  const pendingMarkerData = ref(null)

  // 🎛️ UI State
  const showInfoPanel = ref(false)
  const selectedHydrantId = ref(null)
  const sidebarOpen = ref(false)

  // 📊 Loading States
  const isLoading = ref(false)
  const loadingMessage = ref('')

  // 🔔 Notification State
  const notifications = ref([])

  // 🧮 Computed Properties
  const isPickingPosition = computed(() => {
    return isAddingHydrant.value || isAddingPOI.value || isAddingMarker.value
  })

  const hasUnreadNotifications = computed(() => {
    return notifications.value.some((n) => !n.read)
  })

  // 🎯 Position Picking Actions
  const startHydrantPicking = (hydrantData = null) => {
    console.log('🚒 Start Hydrant Position Picking')

    // Reset andere Picking States
    resetPositionPicking()

    // Setze Hydrant Picking
    isAddingHydrant.value = true
    pendingHydrantData.value = hydrantData || {
      area: '',
      type: 'unterflur',
      status: 'ok',
      lastService: '',
      nextService: '',
    }
  }

  const startPOIPicking = (poiData = null) => {
    console.log('🏭 Start POI Position Picking')

    // Reset andere Picking States
    resetPositionPicking()

    // Setze POI Picking
    isAddingPOI.value = true
    pendingPOIData.value = poiData || {
      name: '',
      category: 'gas_station',
      description: '',
    }
  }

  const startMarkerPicking = (markerData = null) => {
    console.log('📍 Start Marker Position Picking')

    // Reset andere Picking States
    resetPositionPicking()

    // Setze Marker Picking
    isAddingMarker.value = true
    pendingMarkerData.value = markerData || {
      name: '',
      category: 'star',
      description: '',
    }
  }

  const resetPositionPicking = () => {
    console.log('🧹 Reset Position Picking State')

    isAddingHydrant.value = false
    isAddingPOI.value = false
    isAddingMarker.value = false

    pendingHydrantData.value = null
    pendingPOIData.value = null
    pendingMarkerData.value = null
  }

  // 🎛️ UI Actions
  const openInfoPanel = (hydrantId = null) => {
    showInfoPanel.value = true
    if (hydrantId) {
      selectedHydrantId.value = hydrantId
    }
  }

  const closeInfoPanel = () => {
    showInfoPanel.value = false
    selectedHydrantId.value = null
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const openSidebar = () => {
    sidebarOpen.value = true
  }

  const closeSidebar = () => {
    sidebarOpen.value = false
  }

  // 📊 Loading Actions
  const setLoading = (loading, message = '') => {
    isLoading.value = loading
    loadingMessage.value = message

    if (loading) {
      console.log(`⏳ Loading: ${message}`)
    } else {
      console.log('✅ Loading complete')
    }
  }

  // 🔔 Notification Actions
  const addNotification = (notification) => {
    const id = Date.now()
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      type: 'info', // info, success, warning, error
      ...notification,
    }

    notifications.value.unshift(newNotification)

    // Auto-remove nach 5 Sekunden (nur für nicht-kritische)
    if (newNotification.type !== 'error') {
      setTimeout(() => {
        removeNotification(id)
      }, 5000)
    }

    console.log(`🔔 Notification: [${newNotification.type}] ${newNotification.message}`)
    return id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markNotificationAsRead = (id) => {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  // 🔧 Utility Actions
  const resetUI = () => {
    console.log('🔄 Reset Complete UI State')

    resetPositionPicking()
    closeInfoPanel()
    setLoading(false)
    clearAllNotifications()
  }

  // 🚨 Emergency Reset (für Debugging)
  const emergencyReset = () => {
    console.warn('🚨 Emergency UI Reset!')

    // Alle Refs zurücksetzen
    isAddingHydrant.value = false
    isAddingPOI.value = false
    isAddingMarker.value = false
    pendingHydrantData.value = null
    pendingPOIData.value = null
    pendingMarkerData.value = null
    showInfoPanel.value = false
    selectedHydrantId.value = null
    sidebarOpen.value = false
    isLoading.value = false
    loadingMessage.value = ''
    notifications.value = []
  }

  // 📊 Debug Helpers
  const getState = () => {
    return {
      positionPicking: {
        isPickingPosition: isPickingPosition.value,
        isAddingHydrant: isAddingHydrant.value,
        isAddingPOI: isAddingPOI.value,
        isAddingMarker: isAddingMarker.value,
        pendingData: {
          hydrant: pendingHydrantData.value,
          poi: pendingPOIData.value,
          marker: pendingMarkerData.value,
        },
      },
      ui: {
        showInfoPanel: showInfoPanel.value,
        selectedHydrantId: selectedHydrantId.value,
        sidebarOpen: sidebarOpen.value,
        isLoading: isLoading.value,
        loadingMessage: loadingMessage.value,
      },
      notifications: {
        count: notifications.value.length,
        unread: notifications.value.filter((n) => !n.read).length,
        hasUnread: hasUnreadNotifications.value,
      },
    }
  }

  // 📤 Return Store API
  return {
    // State
    isAddingHydrant,
    isAddingPOI,
    isAddingMarker,
    pendingHydrantData,
    pendingPOIData,
    pendingMarkerData,
    showInfoPanel,
    selectedHydrantId,
    sidebarOpen,
    isLoading,
    loadingMessage,
    notifications,

    // Computed
    isPickingPosition,
    hasUnreadNotifications,

    // Position Picking Actions
    startHydrantPicking,
    startPOIPicking,
    startMarkerPicking,
    resetPositionPicking,

    // UI Actions
    openInfoPanel,
    closeInfoPanel,
    toggleSidebar,
    openSidebar,
    closeSidebar,

    // Loading Actions
    setLoading,

    // Notification Actions
    addNotification,
    removeNotification,
    markNotificationAsRead,
    clearAllNotifications,

    // Utility Actions
    resetUI,
    emergencyReset,
    getState,
  }
})
