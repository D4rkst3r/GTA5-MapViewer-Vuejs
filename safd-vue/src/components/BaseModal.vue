<!-- src/components/BaseModal.vue -->
<template>
  <teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && close()">
      <div class="modal-content" :class="[size, { 'modal-no-padding': noPadding }]" @click.stop>
        <!-- Header -->
        <div v-if="!hideHeader" class="modal-header" :style="headerStyle">
          <div class="modal-title">
            <i v-if="icon" :class="icon"></i>
            {{ title }}
          </div>
          <button v-if="!hideClose" class="modal-close" @click="close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, watch, nextTick } from 'vue'

// 🎭 Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Modal',
  },
  icon: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'fullscreen'].includes(value),
  },
  closeOnOverlay: {
    type: Boolean,
    default: true,
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
  hideClose: {
    type: Boolean,
    default: false,
  },
  noPadding: {
    type: Boolean,
    default: false,
  },
  headerColor: {
    type: String,
    default: 'var(--accent-blue)',
  },
})

// 🎭 Emits
const emit = defineEmits(['update:modelValue', 'close'])

// 🧮 Computed
const headerStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.headerColor}, ${props.headerColor}dd)`,
}))

// 🎮 Methods
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

// 🎬 Lifecycle - Body scroll lock
watch(
  () => props.modelValue,
  (isOpen) => {
    nextTick(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    })
  },
)

// 🔑 Keyboard Support
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

// 🎬 Mount/Unmount
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* Modal Sizes */
.small {
  width: 400px;
  max-width: 90vw;
}

.medium {
  width: 600px;
  max-width: 90vw;
}

.large {
  width: 800px;
  max-width: 95vw;
}

.fullscreen {
  width: 95vw;
  height: 95vh;
}

.modal-header {
  padding: 20px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-blue));
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-no-padding .modal-body {
  padding: 0;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    width: 95vw !important;
    height: 95vh;
    border-radius: 12px;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    padding: 16px;
    flex-direction: column;
  }
}
</style>
