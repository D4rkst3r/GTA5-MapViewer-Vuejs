// src/components/ConfirmModal.vue
<template>
  <BaseModal
    v-model="isOpen"
    :title="title"
    icon="fas fa-question-circle"
    size="small"
    :header-color="'var(--warning)'"
    :close-on-overlay="false"
    @close="decline"
  >
    <div class="confirm-content">
      <div class="confirm-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <p class="confirm-message">{{ message }}</p>
    </div>

    <template #footer>
      <button @click="decline" class="btn btn-secondary">
        <i class="fas fa-times"></i>
        Nein
      </button>
      <button @click="confirm" class="btn btn-warning">
        <i class="fas fa-check"></i>
        Ja
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'

// 🎭 Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Bestätigung',
  },
  message: {
    type: String,
    default: 'Sind Sie sicher?',
  },
  onConfirm: {
    type: Function,
    default: () => {},
  },
  onDecline: {
    type: Function,
    default: () => {},
  },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'decline'])

// 📊 Reactive Data
const isOpen = ref(false)

// 👀 Watchers
watch(
  () => props.modelValue,
  (value) => {
    isOpen.value = value
  },
)

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

// 🎮 Methods
const confirm = () => {
  emit('confirm')
  props.onConfirm()
  close()
}

const decline = () => {
  emit('decline')
  props.onDecline()
  close()
}

const close = () => {
  isOpen.value = false
}
</script>

<style scoped>
.confirm-content {
  text-align: center;
  padding: 20px 0;
}

.confirm-icon {
  font-size: 48px;
  color: var(--warning);
  margin-bottom: 20px;
}

.confirm-message {
  font-size: 16px;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
  padding: 0 10px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  flex: 1;
}

.btn-secondary {
  background: var(--surface-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
}

.btn-warning {
  background: var(--warning);
  color: white;
}

.btn-warning:hover {
  background: #e55a00;
  transform: translateY(-1px);
}
</style>

// ========================================
