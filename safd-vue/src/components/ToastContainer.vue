<!-- src/components/ToastContainer.vue -->
<template>
  <div id="toast-container" class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="[toast.type, { show: toast.visible }]"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 📊 Reactive Data
const toasts = ref([])
let toastId = 0

// 🎮 Methods
const showToast = (message, type = 'info', duration = 3000) => {
  const id = ++toastId
  const toast = {
    id,
    message,
    type,
    visible: false,
  }

  toasts.value.push(toast)

  // Show toast after a tick
  setTimeout(() => {
    toast.visible = true
  }, 10)

  // Remove toast after duration
  setTimeout(() => {
    toast.visible = false
    setTimeout(() => {
      const index = toasts.value.findIndex((t) => t.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }, 400) // Wait for animation
  }, duration)
}

// 🌍 Global Toast Function
onMounted(() => {
  window.showToast = showToast
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  max-width: 300px;
}

.toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast.success {
  background: var(--success);
}

.toast.error {
  background: var(--danger);
}

.toast.warning {
  background: var(--warning);
}

.toast.info {
  background: var(--accent-blue);
}
</style>
