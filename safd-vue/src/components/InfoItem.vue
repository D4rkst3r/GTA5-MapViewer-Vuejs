<!-- src/components/InfoItem.vue - CSS FIX -->
<template>
  <div class="info-item">
    <span class="label">{{ label }}:</span>
    <span class="value" :class="statusClass">
      {{ displayValue }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    default: '',
  },
  status: {
    type: String,
    default: '',
  },
})

const displayValue = computed(() => {
  return props.value || 'Nicht angegeben'
})

const statusClass = computed(() => {
  if (!props.status) return ''
  switch (props.status) {
    case 'ok':
    case 'success':
      return 'status-success'
    case 'wartung':
    case 'warning':
      return 'status-warning'
    case 'defekt':
    case 'error':
      return 'status-error'
    default:
      return ''
  }
})
</script>

<style scoped>
.info-item {
  display: flex !important;
  justify-content: space-between !important;
  margin-bottom: 8px !important;
  align-items: center !important;
  padding: 8px 0 !important;
}

.info-item:last-child {
  margin-bottom: 0 !important;
}

.label {
  font-weight: 500 !important;
  color: var(--text-secondary) !important;
  font-size: 14px !important;
}

.value {
  color: var(--text-primary) !important;
  text-align: right !important;
  font-size: 14px !important;
  font-weight: 500 !important;
}

.status-success {
  color: var(--success) !important;
}

.status-warning {
  color: var(--warning) !important;
}

.status-error {
  color: var(--danger) !important;
}
</style>
