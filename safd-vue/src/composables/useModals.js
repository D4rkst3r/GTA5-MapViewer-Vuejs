// src/composables/useModals.js
import { ref } from 'vue'

const modals = ref({
  hydrantForm: false,
  poiForm: false,
  markerForm: false,
  maintenanceModal: false,
  confirmModal: false,
})

const modalData = ref({
  hydrant: null,
  poi: null,
  marker: null,
  confirmOptions: null,
})

export function useModals() {
  // 🔧 Modal Controls
  const openHydrantForm = (hydrant = null) => {
    modalData.value.hydrant = hydrant
    modals.value.hydrantForm = true
  }

  const openPOIForm = (poi = null) => {
    modalData.value.poi = poi
    modals.value.poiForm = true
  }

  const openMarkerForm = (marker = null) => {
    modalData.value.marker = marker
    modals.value.markerForm = true
  }

  const openMaintenanceModal = () => {
    modals.value.maintenanceModal = true
  }

  const showConfirm = (message, title = 'Bestätigung') => {
    return new Promise((resolve) => {
      modalData.value.confirmOptions = {
        title,
        message,
        resolve,
      }
      modals.value.confirmModal = true
    })
  }

  const closeModal = (modalName) => {
    modals.value[modalName] = false
    if (modalName === 'confirmModal' && modalData.value.confirmOptions) {
      modalData.value.confirmOptions.resolve(false)
      modalData.value.confirmOptions = null
    }
  }

  const closeAllModals = () => {
    Object.keys(modals.value).forEach((key) => {
      modals.value[key] = false
    })
    modalData.value = {
      hydrant: null,
      poi: null,
      marker: null,
      confirmOptions: null,
    }
  }

  return {
    modals,
    modalData,
    openHydrantForm,
    openPOIForm,
    openMarkerForm,
    openMaintenanceModal,
    showConfirm,
    closeModal,
    closeAllModals,
  }
}

// ========================================
